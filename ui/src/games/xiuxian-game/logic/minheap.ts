/**
 * 最小堆优先队列 — 移植自 plugins/minheap.js
 *
 * 用于地图探索（mapExploration）中的 A* 寻路算法。
 * 节点可以是任意类型，按 priority 升序出队。
 */
export class MinHeap<T = unknown> {
  private heap: { node: T; priority: number }[] = []

  /** 入堆 */
  add(node: T, priority: number): void {
    this.heap.push({ node, priority })
    this.bubbleUp(this.heap.length - 1)
  }

  /** 上浮 */
  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2)
      if (this.heap[parentIndex].priority <= this.heap[index].priority) break
      ;[this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]]
      index = parentIndex
    }
  }

  /** 出堆：移除并返回优先级最小的节点 */
  poll(): T | undefined {
    if (this.heap.length === 0) return undefined
    const min = this.heap[0]
    const end = this.heap.pop()
    if (this.heap.length > 0 && end !== undefined) {
      this.heap[0] = end
      this.bubbleDown(0)
    }
    return min.node
  }

  /** 下沉 */
  private bubbleDown(index: number): void {
    const length = this.heap.length
    const element = this.heap[index]
    while (true) {
      const leftChildIndex = 2 * index + 1
      const rightChildIndex = 2 * index + 2
      let swapIndex: number | null = null
      if (leftChildIndex < length && this.heap[leftChildIndex].priority < element.priority) {
        swapIndex = leftChildIndex
      }
      if (rightChildIndex < length) {
        if (
          (swapIndex === null && this.heap[rightChildIndex].priority < element.priority) ||
          (swapIndex !== null && this.heap[rightChildIndex].priority < this.heap[leftChildIndex].priority)
        ) {
          swapIndex = rightChildIndex
        }
      }
      if (swapIndex === null) break
      ;[this.heap[index], this.heap[swapIndex]] = [this.heap[swapIndex], this.heap[index]]
      index = swapIndex
    }
  }

  /** 是否为空 */
  isEmpty(): boolean {
    return this.heap.length === 0
  }

  /** 堆大小 */
  size(): number {
    return this.heap.length
  }
}

export default MinHeap
