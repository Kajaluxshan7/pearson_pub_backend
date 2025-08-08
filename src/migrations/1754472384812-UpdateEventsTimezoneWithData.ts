// import { MigrationInterface, QueryRunner } from "typeorm";

// export class UpdateEventsTimezoneWithData1754472384812 implements MigrationInterface {

//     public async up(queryRunner: QueryRunner): Promise<void> {
//         // First, handle any null values by setting them to current date (as temporary placeholders)
//         await queryRunner.query(`
//             UPDATE "events"
//             SET "start_date" = CURRENT_DATE
//             WHERE "start_date" IS NULL
//         `);

//         await queryRunner.query(`
//             UPDATE "events"
//             SET "end_date" = CURRENT_DATE
//             WHERE "end_date" IS NULL
//         `);

//         // Convert existing date columns to timestamptz
//         // This will preserve the existing dates but convert them to timestamp with timezone
//         await queryRunner.query(`
//             ALTER TABLE "events"
//             ALTER COLUMN "start_date" TYPE TIMESTAMP WITH TIME ZONE
//             USING "start_date"::timestamp AT TIME ZONE 'America/Toronto'
//         `);

//         await queryRunner.query(`
//             ALTER TABLE "events"
//             ALTER COLUMN "end_date" TYPE TIMESTAMP WITH TIME ZONE
//             USING "end_date"::timestamp AT TIME ZONE 'America/Toronto'
//         `);
//     }

//     public async down(queryRunner: QueryRunner): Promise<void> {
//         // Convert back to date columns
//         await queryRunner.query(`
//             ALTER TABLE "events"
//             ALTER COLUMN "start_date" TYPE DATE
//             USING "start_date"::date
//         `);

//         await queryRunner.query(`
//             ALTER TABLE "events"
//             ALTER COLUMN "end_date" TYPE DATE
//             USING "end_date"::date
//         `);
//     }

// }grationInterface, QueryRunner } from "typeorm";

// export class UpdateEventsTimezoneWithData1754472384812 implements MigrationInterface {

//     public async up(queryRunner: QueryRunner): Promise<void> {
//     }

//     public async down(queryRunner: QueryRunner): Promise<void> {
//     }

// }
