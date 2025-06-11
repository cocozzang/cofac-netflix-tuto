import { BadRequestException, Injectable } from '@nestjs/common';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PagePaginationDto } from './dto/page-pagination.dto';
import { CursorPaginationDto } from './dto/cursor-pagination.dto';

interface PageCursorInfo {
  values: PageCursorValues;
  order: PageCursorOrder;
}

type PageCursorValues = Record<string, string | number>;

type PageCursorOrder = string[];

@Injectable()
export class CommonService {
  constructor() {}

  applyPagePaginationParamsToQb<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    dto: PagePaginationDto,
  ) {
    const { take, page } = dto;

    const skip = (page - 1) * take;

    qb.take(take);
    qb.skip(skip);
  }

  async applyCursorPaginationParamsToQb<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    dto: CursorPaginationDto,
  ) {
    const { cursor, take } = dto;
    let { order } = dto;

    if (cursor) {
      const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');

      const cursorObj = JSON.parse(decodedCursor) as PageCursorInfo;

      order = cursorObj.order;

      const { values } = cursorObj;

      const columns = Object.keys(values);
      const comparisonOperator = order.some((orderElement) =>
        orderElement.endsWith('DESC'),
      )
        ? '<'
        : '>';
      const whereConditions = columns
        .map((column) => `${qb.alias}.${column}`)
        .join(',');
      const whereParams = columns.map((column) => `:${column}`).join(',');

      qb.where(
        `(${whereConditions}) ${comparisonOperator} (${whereParams})`,
        values,
      );
    }

    // ["likeCount_DESC", "id_DESC]
    for (let i = 0; i < order.length; i++) {
      const [column, direction] = order[i].split('_');

      if (direction !== 'ASC' && direction !== 'DESC')
        throw new BadRequestException(
          '정렬부분을 ASC 또는 DESC로 입력해주세요',
        );

      if (i === 0) {
        qb.orderBy(`${qb.alias}.${column}`, direction);
      } else {
        qb.addOrderBy(`${qb.alias}.${column}`, direction);
      }
    }

    qb.take(take);

    const results = await qb.getMany();

    const nextCursor = this.generateNextCursor(results, order);

    return { qb, nextCursor };
  }

  generateNextCursor<T>(results: T[], order: PageCursorOrder): string | null {
    if (results.length === 0) return null;

    const lastItem = results[results.length - 1];

    const values: PageCursorValues = {};

    order.forEach((columnOrder) => {
      const [column] = columnOrder.split('_');
      values[column] = lastItem[column] as string | number;
    });

    const cursorObj: PageCursorInfo = { values, order };

    const nextCursorEncodedBase64 = Buffer.from(
      JSON.stringify(cursorObj),
    ).toString('base64');

    return nextCursorEncodedBase64;
  }
}
