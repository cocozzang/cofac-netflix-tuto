import { CommonController } from './common.controller';
import { CommonService } from './common.service';
import { Mocked } from '@suites/doubles.jest';
import { TestBed } from '@suites/unit';

describe('CommonController', () => {
  let controller: CommonController;
  let service: Mocked<CommonService>;

  beforeEach(async () => {
    const { unit, unitRef } =
      await TestBed.solitary(CommonController).compile();

    controller = unit;
    service = unitRef.get(CommonService) as unknown as Mocked<CommonService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });
});
