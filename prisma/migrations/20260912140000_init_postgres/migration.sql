-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "FPOSubmission" (
    "id" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "fpoGroupId" TEXT,
    "fpoName" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "registrationType" TEXT NOT NULL,
    "activeMembers" INTEGER NOT NULL,
    "members2YrAgo" INTEGER NOT NULL,
    "revenueYear1" DOUBLE PRECISION NOT NULL,
    "revenueYear2" DOUBLE PRECISION,
    "revenueYear3" DOUBLE PRECISION,
    "costYear1" DOUBLE PRECISION NOT NULL,
    "costYear2" DOUBLE PRECISION,
    "costYear3" DOUBLE PRECISION,
    "products" TEXT NOT NULL,
    "activeBuyersCount" INTEGER NOT NULL,
    "contractSalesPct" DOUBLE PRECISION NOT NULL,
    "estimatedPriceRealizationPct" DOUBLE PRECISION,
    "auditedAccounts" BOOLEAN NOT NULL,
    "agmCountLastYear" INTEGER NOT NULL,
    "boardMeetingsLastYear" INTEGER NOT NULL,
    "email" TEXT,
    "optedIntoLeaderboard" BOOLEAN NOT NULL DEFAULT false,
    "facilitatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FPOSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapItem" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "stageLabel" TEXT NOT NULL,
    "actionText" TEXT NOT NULL,
    "targetFactor" TEXT NOT NULL,
    "estimatedScoreImpact" DOUBLE PRECISION NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchemeReference" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eligibilityTags" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchemeReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LenderTypeReference" (
    "id" TEXT NOT NULL,
    "lenderType" TEXT NOT NULL,
    "minBandRequired" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "typicalUseCase" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LenderTypeReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facilitator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facilitator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreResult" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "band" TEXT NOT NULL,
    "membershipScore" DOUBLE PRECISION NOT NULL,
    "revenueStabilityScore" DOUBLE PRECISION NOT NULL,
    "costEfficiencyScore" DOUBLE PRECISION NOT NULL,
    "diversificationScore" DOUBLE PRECISION NOT NULL,
    "marketLinkageScore" DOUBLE PRECISION NOT NULL,
    "governanceScore" DOUBLE PRECISION NOT NULL,
    "narrativeSummary" TEXT NOT NULL,
    "suggestions" TEXT NOT NULL,
    "dataCompletenessFlag" BOOLEAN NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FPOSubmission_accessToken_key" ON "FPOSubmission"("accessToken");

-- CreateIndex
CREATE INDEX "FPOSubmission_fpoGroupId_idx" ON "FPOSubmission"("fpoGroupId");

-- CreateIndex
CREATE INDEX "FPOSubmission_facilitatorId_idx" ON "FPOSubmission"("facilitatorId");

-- CreateIndex
CREATE INDEX "FPOSubmission_state_district_optedIntoLeaderboard_idx" ON "FPOSubmission"("state", "district", "optedIntoLeaderboard");

-- CreateIndex
CREATE INDEX "RoadmapItem_submissionId_idx" ON "RoadmapItem"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "SchemeReference_name_key" ON "SchemeReference"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LenderTypeReference_lenderType_key" ON "LenderTypeReference"("lenderType");

-- CreateIndex
CREATE UNIQUE INDEX "Facilitator_accessToken_key" ON "Facilitator"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreResult_submissionId_key" ON "ScoreResult"("submissionId");

-- AddForeignKey
ALTER TABLE "FPOSubmission" ADD CONSTRAINT "FPOSubmission_facilitatorId_fkey" FOREIGN KEY ("facilitatorId") REFERENCES "Facilitator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapItem" ADD CONSTRAINT "RoadmapItem_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "FPOSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreResult" ADD CONSTRAINT "ScoreResult_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "FPOSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed curated government scheme references for the Scheme Matcher feature.
-- Curated/seeded dataset (not a live government integration), per Feature Expansion PRD 2.3.

INSERT INTO "SchemeReference" ("id", "name", "eligibilityTags", "description", "link", "active", "createdAt", "updatedAt") VALUES
('6ccc544c-a2be-4c36-ac75-23cff3d2a168', 'e-NAM (electronic National Agriculture Market)', 'low-marketLinkage', 'Onboard to the electronic National Agriculture Market for transparent price discovery and pan-India buyer reach for your produce.', 'https://www.enam.gov.in/', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('b10c66ff-b88b-4175-8dc5-fd41848e9bab', 'NABARD Interest Subvention on FPO Credit', 'low-governance,low-costEfficiency', 'Access interest subvention (effective rate significantly below commercial lending) on working capital loans for FPOs that maintain audited accounts and formal governance.', 'https://www.nabard.org/', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('87320635-313e-4273-81fd-cc105e17f509', 'Venture Capital Assistance (SFAC)', 'low-membership,low-diversification', 'Venture / equity support from SFAC for FPOs with a bankable project to fund aggregation, processing, and infrastructure expansion.', 'https://www.sfacindia.com/', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('803ea142-136a-4e74-8260-c70d4c296129', 'PM Formalisation of Micro Food Processing Enterprises (PMFME)', 'low-diversification', 'Capital subsidy for FPOs entering food processing, grading, packaging and value-addition across the agri-horticulture supply chain.', 'https://pmfme.mofpi.gov.in/', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('61386a43-99eb-4972-9d16-fa091c179fe3', 'Agricultural Marketing Infrastructure (AMI) Fund', 'low-marketLinkage,low-costEfficiency', 'NABARD-subsidised credit for building marketing, aggregation and post-harvest infrastructure such as cold storage and packhouses.', 'https://www.nabard.org/', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('8ff5d829-a3fe-4066-aeed-7abeb921dfe1', 'Agri Infrastructure Fund (AIF)', 'low-costEfficiency,low-revenueStability', 'Long-term concessional debt from the NABARD/DAC scheme for developing farm-gate storage, customs clearance and logistics infrastructure.', 'https://agriinfra.dac.gov.in/', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('db05a43a-4b87-4f8c-b370-e8adf59726be', 'FPO Facilitation & Capacity Building (SFAC/CBBO)', 'low-membership,low-governance', 'Dedicated hand-holding support through SFAC Cluster Based Business Organizations (CBBOs) to strengthen FPO governance, financial discipline and member mobilisation.', 'https://www.sfacindia.com/', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed curated lender-type references for the "Which Lender Fits Me" matcher.
-- Curated/seeded dataset (no live institution integration), per Final Feature PRD 1.2.

INSERT INTO "LenderTypeReference" ("id", "lenderType", "minBandRequired", "description", "typicalUseCase", "active", "createdAt", "updatedAt") VALUES
('7f0fbf3e-2b30-4c12-9e0a-1a57d4f25b01', 'District Central Co-operative Bank (DCCB)', 'Early Stage', 'Member-owned district-level co-operative bank serving primary agricultural credit societies and FPOs.', 'Entry-point institutional credit for cooperative-registered FPOs: crop loans, working capital, and one-window access to district co-operative structures.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('b14284a0-1c6a-4b94-af2c-3303f5e8dc12', 'Microfinance institution / NBFC-MFI', 'Early Stage', 'Small-loan lender focused on farmer livelihood groups and early-stage collectives.', 'Bridge credit while institutional records, audits, and governance practices develop — repaid as the FPO formalises.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('3f6c0d99-cc7a-4f8a-9c21-7b8a1f0d6a13', 'Regional Rural Bank (RRB)', 'Developing', 'Government-owned bank with a rural lending mandate under Regional Rural Banks Act, 1976.', 'Rural-focused term and working-capital credit aligned to priority-sector lending targets, with accessible branch networks in block headquarters.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('8d9e2b73-12a0-421e-b916-4f30c0a7e214', 'NABARD refinance-backed lending (via sponsor bank)', 'Developing', 'Working capital and investment credit refinanced under NABARD schemes such as the FPO credit facility.', 'Capital for aggregation, godowns and processing where audited accounts already exist — typically routed through a sponsor bank.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('c4a8f5d2-6b1f-4a3c-8d6e-9a0b3c1d2e15', 'Small Finance Bank (SFB)', 'Moderate', 'Schedule-bank licence with a mandate to serve small businesses and formalising farmer enterprises.', 'A formal banking relationship (savings plus credit) for mid-stage FPOs moving from project loans to repeat borrowing.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('e7b2a933-55d4-4b0a-9e1c-2c4a7f8b0916', 'Private / Scheduled Commercial Bank', 'Moderate', 'Mainstream commercial bank with an agri-business vertical and priority-sector obligations.', 'Larger structured credit lines — term loans, ODs, and trade finance — for credit-ready FPOs with audited financials and a bankable project.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('a1d43fc8-7e2b-4b5a-9c31-6e8f0a2b4c17', 'Priority-sector commercial credit (bulk / syndication)', 'Strong', 'Large structured agri-credit facilities, often syndicated, for the most credit-ready collectives.', 'Multi-crore working-capital and infrastructure facilities for Strong-band FPOs pursuing major aggregation or processing investments.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);