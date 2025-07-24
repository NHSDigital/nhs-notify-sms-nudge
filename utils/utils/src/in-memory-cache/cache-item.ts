export class CacheItem<T = unknown> {
  private createdAt = Date.now();

  constructor(
    public readonly data: T,
    private ttl: number | null,
  ) {}

  get isExpired(): boolean {
    return (
      CacheItem.isValidTtl(this.ttl) && Date.now() >= this.createdAt + this.ttl
    );
  }

  private static isValidTtl(ttl: number | null): ttl is number {
    return ttl !== null && ttl > 0;
  }
}
