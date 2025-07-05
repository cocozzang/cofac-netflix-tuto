import { ObjectLiteral, Repository } from 'typeorm';

export function createAutoMock<T>(
  originalClass: new (...args: any[]) => T,
): jest.Mocked<T> {
  const mockInstance = {} as jest.Mocked<T>;

  // 프로토타입의 모든 메서드를 jest.fn()으로 변환
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const prototype = originalClass.prototype;
  Object.getOwnPropertyNames(prototype).forEach((name) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (name !== 'constructor' && typeof prototype[name] === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      mockInstance[name as keyof T] = jest.fn() as any;
    }
  });

  return mockInstance;
}

export function createMockRepository<T extends ObjectLiteral>(): jest.Mocked<
  Repository<T>
> {
  const mockRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findBy: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findOneOrFail: jest.fn(),
    findOneByOrFail: jest.fn(),
    count: jest.fn(),
    countBy: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnThis(),

    manager: undefined as unknown,
    metadata: undefined as unknown,
    target: undefined as unknown,
    queryRunner: undefined,
  };

  // ✅ unknown을 거쳐서 타입 단언
  return mockRepository as unknown as jest.Mocked<Repository<T>>;
}
