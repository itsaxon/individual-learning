<#
.SYNOPSIS
    frame-parent 企业级 DDD 脚手架重命名工具（重构版）
.DESCRIPTION
    动态扫描 Maven 模块、Java 包、启动类，零写死模块名。
    支持 Windows PowerShell 5.1 / PowerShell 7+，跨平台兼容。
    支持 -DryRun 预览模式，支持 UTF-8 无 BOM。
.EXAMPLE
    # 交互式运行
    .\rename-project.ps1
.EXAMPLE
    # 参数式运行
    .\rename-project.ps1 -NewProjectName "my-shop" -NewGroupId "com.mycompany" -NewModulePrefix "shop"
.EXAMPLE
    # 预览模式（不实际修改）
    .\rename-project.ps1 -NewProjectName "my-shop" -NewGroupId "com.mycompany" -DryRun
.NOTES
    脚本不会移动自身所在的项目根目录（Windows 文件锁限制），执行结束后提示用户手动重命名根目录。
    建议运行前用 git commit 保存当前状态，以便回滚。
#>

param(
    [string]$NewProjectName,
    [string]$NewGroupId,
    [string]$NewPackagePrefix,
    [string]$NewModulePrefix,
    [switch]$DryRun
)

# ============================================================
# 全局状态
# ============================================================

$script:ProjectRoot   = $PSScriptRoot
$script:OldProjectName = "frame-parent"
$script:OldGroupId     = "com.frame"
$script:OldModulePre   = "frame"
$script:Stats          = @{ Files = 0; Dirs = 0; Classes = 0 }
$script:Actions        = [System.Collections.Generic.List[string]]::new()
$script:CachedModules  = $null  # 缓存扫描到的旧模块名（避免文件替换后 pom.xml 变更导致扫描不到）

# 文本文件扩展名白名单（不在列表中的文件不被扫描）
$script:TextExtensions = @(
    '.xml','.java','.kt','.groovy','.yml','.yaml','.properties',
    '.md','.sql','.gradle','.kts','.json','.txt','.cfg','.ini','.tf'
)

# 排除目录正则（匹配路径分隔符 + 目录名 + 路径分隔符）
$script:ExcludeRegex = '(\\|/)(target|\.git|\.idea|node_modules|\.mvn|logs|build|dist)(\\|/)'

# ============================================================
# 编码工具：兼容 PowerShell 5.1 和 7+
# ============================================================

function Read-FileContent {
    param([string]$Path)
    try {
        return [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
    } catch {
        return $null
    }
}

function Write-FileContent {
    param([string]$Path, [string]$Content)
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

# ============================================================
# 参数收集
# ============================================================

function Read-Arguments {
    if (-not $NewProjectName) {
        $NewProjectName = Read-Host "请输入新项目名（如 my-shop，将作为 artifactId）"
        if (-not $NewProjectName) { Write-Error "项目名不能为空"; exit 1 }
    }

    if (-not $NewGroupId) {
        $default = "com." + ($NewProjectName -replace '[^a-zA-Z0-9]','')
        $NewGroupId = Read-Host "请输入新 groupId（默认 $default）"
        if (-not $NewGroupId) { $NewGroupId = $default }
    }

    if (-not $NewPackagePrefix) {
        $NewPackagePrefix = $NewGroupId
    }

    if (-not $NewModulePrefix) {
        $NewModulePrefix = $NewProjectName -replace '[^a-zA-Z0-9]',''
    }

    if ([string]::IsNullOrWhiteSpace($NewModulePrefix)) {
        throw "模块名前缀不能为空：请检查 NewProjectName / NewModulePrefix 是否只含特殊字符"
    }

    $script:NewProjectName = $NewProjectName
    $script:NewGroupId     = $NewGroupId
    $script:NewPackageRef  = $NewPackagePrefix
    $script:NewModulePre   = $NewModulePrefix
    $script:NewDirSeg      = $NewPackagePrefix -replace '\.', [IO.Path]::DirectorySeparatorChar
}

# ============================================================
# 动态扫描：从 pom.xml 读取模块列表
# ============================================================

function Scan-Modules {
    # 优先返回缓存（文件替换后 pom.xml 内容已变，不能再重新扫描）
    if ($null -ne $script:CachedModules) {
        return $script:CachedModules
    }

    $pomPath = Join-Path $script:ProjectRoot "pom.xml"
    if (-not (Test-Path $pomPath)) {
        throw "未找到根 pom.xml: $pomPath"
    }

    $content = Read-FileContent $pomPath
    $modules = [System.Collections.Generic.List[string]]::new()

    # 匹配 <module>xxx</module>
    $matches = [regex]::Matches($content, '<module>\s*([^<]+?)\s*</module>')
    foreach ($m in $matches) {
        $modName = $m.Groups[1].Value.Trim()
        if ($modName) {
            $modules.Add($modName)
        }
    }

    if ($modules.Count -eq 0) {
        throw "pom.xml 中未扫描到任何 <module> 配置"
    }

    # 缓存到全局变量
    $script:CachedModules = $modules
    return $modules
}

# ============================================================
# 动态扫描：识别旧包路径（com/frame）
# ============================================================

function Get-OldPackageDir {
    # groupId com.frame -> 目录 com/frame
    $parts = $script:OldGroupId -split '\.'
    return ($parts -join [IO.Path]::DirectorySeparatorChar)
}

function Get-NewPackageDir {
    $parts = $script:NewPackageRef -split '\.'
    return ($parts -join [IO.Path]::DirectorySeparatorChar)
}

# ============================================================
# 动态扫描：找到所有 *Application.java 和 *MetaObjectHandler.java
# ============================================================

function Find-ClassesToRename {
    $result = [System.Collections.Generic.List[hashtable]]::new()

    $patterns = @(
        @{ OldSuffix = "Application.java";        ClassName = "Application" },
        @{ OldSuffix = "MetaObjectHandler.java";  ClassName = "MetaObjectHandler" }
    )

    foreach ($pat in $patterns) {
        $files = Get-ChildItem -Path $script:ProjectRoot -Recurse -File -Filter "*$($pat.OldSuffix)" |
            Where-Object { $_.FullName -notmatch $script:ExcludeRegex }

        foreach ($f in $files) {
            # 提取类名（不含扩展名）
            $oldClassName = $f.BaseName
            # 旧前缀：Frame / Xxx（取类名首段 Pascal 命名的第一部分）
            # 这里通用处理：将 OldModulePre 的 Pascal 形式替换为 NewModulePre 的 Pascal 形式
            $oldPascal = (Get-PascalCase $script:OldModulePre)
            $newPascal = (Get-PascalCase $script:NewModulePre)

            $newClassName = $oldClassName
            if ($oldClassName.StartsWith($oldPascal)) {
                $newClassName = $newPascal + $oldClassName.Substring($oldPascal.Length)
            } else {
                # 如果不是以旧前缀开头，直接用新前缀 + ClassName
                $newClassName = $newPascal + $pat.ClassName
            }

            $result.Add(@{
                FilePath    = $f.FullName
                OldClassName = $oldClassName
                NewClassName = $newClassName
            })
        }
    }

    return $result
}

function Get-PascalCase {
    param([string]$s)
    if ([string]::IsNullOrWhiteSpace($s)) { return $s }
    return $s.Substring(0,1).ToUpper() + $s.Substring(1)
}

# ============================================================
# 构建：文本替换映射表
# ============================================================

function Get-Replacements {
    $oldPascal = Get-PascalCase $script:OldModulePre
    $newPascal = Get-PascalCase $script:NewModulePre

    # 顺序敏感：长串优先替换
    $repl = [ordered]@{
        # 类名（最长，优先替换）
        "${oldPascal}MetaObjectHandler" = "${newPascal}MetaObjectHandler"
        "${oldPascal}Application"       = "${newPascal}Application"
        "${oldPascal}HikariPool"        = "${newPascal}HikariPool"
        # artifactId / 模块名（含连字符）
        $script:OldProjectName          = $script:NewProjectName
    }

    # 动态添加模块名替换（从扫描结果获取）
    $modules = Scan-Modules
    foreach ($mod in $modules) {
        if (-not $repl.Contains($mod)) {
            $newMod = $mod -replace "^$([regex]::Escape($script:OldModulePre))", $script:NewModulePre
            $repl[$mod] = $newMod
        }
    }

    # groupId / 包名引用（最后替换，避免误伤）
    $repl[$script:OldGroupId] = $script:NewGroupId

    return $repl
}

# ============================================================
# 文件内容替换
# ============================================================

function Replace-FileContent {
    param([string]$Path, [hashtable]$Replacements)

    $content = Read-FileContent $Path
    if ($null -eq $content) { return $false }

    $changed = $false
    foreach ($key in $Replacements.Keys) {
        if ($content -match [regex]::Escape($key)) {
            $content = $content -replace ([regex]::Escape($key)), $Replacements[$key]
            $changed = $true
        }
    }

    if ($changed) {
        if (-not $DryRun) {
            Write-FileContent -Path $Path -Content $content
        }
        $script:Stats.Files++
        $script:Actions.Add("  [文件] $Path")
        return $true
    }
    return $false
}

function Replace-AllFiles {
    param([hashtable]$Replacements)

    # 一次扫描，按扩展名过滤
    $allFiles = Get-ChildItem -Path $script:ProjectRoot -Recurse -File |
        Where-Object {
            ($_.FullName -notmatch $script:ExcludeRegex) -and
            ($script:TextExtensions -contains $_.Extension.ToLower())
        }

    foreach ($file in $allFiles) {
        Replace-FileContent -Path $file.FullName -Replacements $Replacements
    }
}

# ============================================================
# 移动 Java 包目录
# ============================================================

function Move-PackageDirs {
    $oldPkgDir = Get-OldPackageDir    # com\frame
    $newPkgDir = Get-NewPackageDir    # com\mycompany

    if ([string]::IsNullOrWhiteSpace($oldPkgDir)) { return }

    $modules = Scan-Modules

    foreach ($mod in $modules) {
        $modPath = Join-Path $script:ProjectRoot $mod
        if (-not (Test-Path $modPath)) { continue }

        # 处理 src/main/java 和 src/test/java（用反斜杠确保 Windows 兼容）
        foreach ($srcType in @("src\main\java", "src\test\java")) {
            $srcRoot = Join-Path $modPath $srcType
            if (-not (Test-Path $srcRoot)) { continue }

            $oldPkgPath = Join-Path $srcRoot $oldPkgDir
            if (-not (Test-Path $oldPkgPath)) { continue }

            $newPkgPath = Join-Path $srcRoot $newPkgDir
            $newPkgParent = Split-Path $newPkgPath -Parent

            if ($DryRun) {
                $script:Stats.Dirs++
                $script:Actions.Add("  [目录] $oldPkgPath -> $newPkgPath")
                continue
            }

            # 确保父目录存在
            if (-not (Test-Path $newPkgParent)) {
                New-Item -ItemType Directory -Path $newPkgParent -Force | Out-Null
            }

            # 如果新目录已存在，合并内容；否则直接移动
            if (Test-Path $newPkgPath) {
                # 合并：将旧目录的内容移动到新目录
                Get-ChildItem $oldPkgPath -Force | ForEach-Object {
                    $dest = Join-Path $newPkgPath $_.Name
                    Move-Item $_.FullName $dest -Force
                }
            } else {
                Move-Item $oldPkgPath $newPkgPath -Force
            }

            $script:Stats.Dirs++
            $script:Actions.Add("  [目录] $oldPkgPath -> $newPkgPath")

            # 清理空目录（从 oldPkgDir 最深层往上逐级清理）
            $checkPath = $oldPkgPath
            $oldParts = $oldPkgDir -split ([regex]::Escape([IO.Path]::DirectorySeparatorChar))
            for ($i = 0; $i -lt $oldParts.Length; $i++) {
                if (Test-Path $checkPath) {
                    $items = Get-ChildItem $checkPath -Force -ErrorAction SilentlyContinue
                    if ($items.Count -eq 0) {
                        Remove-Item $checkPath -Force -ErrorAction SilentlyContinue
                    }
                }
                $checkPath = Split-Path $checkPath -Parent
            }
        }
    }
}

# ============================================================
# 重命名 Java 类文件
# ============================================================

function Rename-JavaFiles {
    $classes = Find-ClassesToRename

    foreach ($cls in $classes) {
        $dir = Split-Path $cls.FilePath -Parent
        $newFileName = "$($cls.NewClassName).java"
        $newFilePath = Join-Path $dir $newFileName

        if ($DryRun) {
            $script:Stats.Classes++
            $script:Actions.Add("  [类名] $($cls.OldClassName).java -> $newFileName")
            continue
        }

        # 使用 -NewName 而非完整路径
        Rename-Item -Path $cls.FilePath -NewName $newFileName -Force
        $script:Stats.Classes++
        $script:Actions.Add("  [类名] $($cls.OldClassName).java -> $newFileName")
    }
}

# ============================================================
# 重命名模块目录
# ============================================================

function Rename-ModuleDirs {
    $modules = Scan-Modules

    # 从深到浅排序（避免父目录先被移动导致子目录找不到）
    $sorted = $modules | Sort-Object { $_.Length } -Descending

    foreach ($mod in $sorted) {
        $oldPath = Join-Path $script:ProjectRoot $mod
        if (-not (Test-Path $oldPath)) { continue }

        $newModName = $mod -replace "^$([regex]::Escape($script:OldModulePre))", $script:NewModulePre
        if ($mod -eq $newModName) { continue }

        $newPath = Join-Path $script:ProjectRoot $newModName

        if (Test-Path $newPath) {
            Write-Warning "目标模块目录已存在，跳过: $newPath"
            continue
        }

        if ($DryRun) {
            $script:Stats.Dirs++
            $script:Actions.Add("  [模块] $mod -> $newModName")
            continue
        }

        Move-Item $oldPath $newPath -Force
        $script:Stats.Dirs++
        $script:Actions.Add("  [模块] $mod -> $newModName")
    }
}

# ============================================================
# 主流程
# ============================================================

function Main {
    Read-Arguments

    Write-Host ""
    Write-Host "========================================" -ForegroundColor White
    Write-Host "  frame-parent 脚手架重命名工具" -ForegroundColor White
    if ($DryRun) {
        Write-Host "  [预览模式 - 不实际修改]" -ForegroundColor Yellow
    }
    Write-Host "========================================" -ForegroundColor White
    Write-Host ""
    Write-Host "旧项目名:    $script:OldProjectName"
    Write-Host "新项目名:    $script:NewProjectName"
    Write-Host "旧 groupId:  $script:OldGroupId"
    Write-Host "新 groupId:  $script:NewGroupId"
    Write-Host "旧包名前缀:  $script:OldGroupId"
    Write-Host "新包名前缀:  $script:NewPackageRef"
    Write-Host "旧模块前缀:  $script:OldModulePre"
    Write-Host "新模块前缀:  $script:NewModulePre"
    Write-Host ""

    # 扫描模块
    $modules = Scan-Modules
    Write-Host "扫描到 Maven 模块 ($($modules.Count) 个):" -ForegroundColor Cyan
    foreach ($m in $modules) { Write-Host "  - $m" }
    Write-Host ""

    if (-not $DryRun) {
        $confirm = Read-Host "确认执行？(y/N)"
        if ($confirm -ne "y" -and $confirm -ne "Y") {
            Write-Host "已取消"; exit 0
        }
    }

    # 步骤 1: 替换文件内容
    Write-Host ""
    Write-Host "--- 步骤 1/4: 替换文件内容 ---" -ForegroundColor White
    $replacements = Get-Replacements
    Replace-AllFiles -Replacements $replacements
    Write-Host "  完成: $($script:Stats.Files) 个文件被修改" -ForegroundColor Green

    # 步骤 2: 移动 Java 包目录
    Write-Host ""
    Write-Host "--- 步骤 2/4: 移动 Java 包目录 ---" -ForegroundColor White
    Move-PackageDirs
    Write-Host "  完成: $($script:Stats.Dirs) 个目录被移动" -ForegroundColor Green

    # 步骤 3: 重命名 Java 类文件
    Write-Host ""
    Write-Host "--- 步骤 3/4: 重命名 Java 类文件 ---" -ForegroundColor White
    Rename-JavaFiles
    Write-Host "  完成: $($script:Stats.Classes) 个类被重命名" -ForegroundColor Green

    # 步骤 4: 重命名模块目录
    Write-Host ""
    Write-Host "--- 步骤 4/4: 重命名模块目录 ---" -ForegroundColor White
    $dirCountBefore = $script:Stats.Dirs
    Rename-ModuleDirs
    Write-Host "  完成: $($script:Stats.Dirs - $dirCountBefore) 个模块被重命名" -ForegroundColor Green

    # 最终报告
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  重命名完成！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "统计：" -ForegroundColor Yellow
    Write-Host "  文件修改:  $($script:Stats.Files)"
    Write-Host "  目录移动:  $($script:Stats.Dirs)"
    Write-Host "  类重命名:  $($script:Stats.Classes)"
    Write-Host ""

    if ($DryRun) {
        Write-Host "操作清单：" -ForegroundColor Yellow
        foreach ($a in $script:Actions) {
            Write-Host $a
        }
        Write-Host ""
        Write-Host "（预览模式，未实际修改任何文件）" -ForegroundColor Yellow
        return
    }

    Write-Host "后续步骤：" -ForegroundColor Yellow
    Write-Host "  1. 手动将项目根目录 $script:OldProjectName 改名为 $script:NewProjectName"
    Write-Host "     (Windows 文件锁限制，脚本无法移动自身所在目录)"
    Write-Host "  2. 检查 application-dev.yml 中的数据库名和用户名（frame_parent）是否需要更新"
    Write-Host "  3. 检查 application.yml 中的 JWT secret 是否需要更新"
    Write-Host "  4. 检查 logback-spring.xml 中的日志路径"
    Write-Host "  5. 执行 mvn clean test 验证编译和测试"
    Write-Host ""
    Write-Host "注意：数据库表名（sys_user 等）未修改，如需修改请手动调整 schema.sql"
    Write-Host ""
}

Main
