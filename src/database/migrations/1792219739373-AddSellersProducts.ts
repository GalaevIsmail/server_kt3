import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSellersProducts1792219739373 implements MigrationInterface {
    name = 'AddSellersProducts1792219739373'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "products" ("id" SERIAL NOT NULL, "title" character varying(200) NOT NULL, "description" text NOT NULL, "price" numeric(12,2) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "seller_id" integer NOT NULL, CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_425ee27c69d6b8adc5d6475dcf" ON "products" ("seller_id") `);
        await queryRunner.query(`CREATE TABLE "sellers" ("id" SERIAL NOT NULL, "name" character varying(120) NOT NULL, "email" character varying(254) NOT NULL, CONSTRAINT "UQ_60a049dd3231ed458dccfdaf406" UNIQUE ("email"), CONSTRAINT "PK_97337ccbf692c58e6c7682de8a2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_425ee27c69d6b8adc5d6475dcfe" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_425ee27c69d6b8adc5d6475dcfe"`);
        await queryRunner.query(`DROP TABLE "sellers"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_425ee27c69d6b8adc5d6475dcf"`);
        await queryRunner.query(`DROP TABLE "products"`);
    }

}
