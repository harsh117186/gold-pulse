declare module 'proper-lockfile' {
  interface LockOptions {
    retries?: number;
    stale?: number;
    realpath?: boolean;
    fs?: any;
  }

  function lock(file: string, options?: LockOptions): Promise<() => Promise<void>>;
  function unlock(file: string, options?: LockOptions): Promise<void>;
  function check(file: string, options?: LockOptions): Promise<boolean>;

  const lockfile: {
    lock: typeof lock;
    unlock: typeof unlock;
    check: typeof check;
  };

  export default lockfile;
} 