-- CreateIndex
CREATE INDEX "Client_lastName_firstName_idx" ON "public"."Client"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "Client_statusId_contractEndDate_idx" ON "public"."Client"("statusId", "contractEndDate");

-- CreateIndex
CREATE INDEX "Client_contractEndDate_idx" ON "public"."Client"("contractEndDate");
