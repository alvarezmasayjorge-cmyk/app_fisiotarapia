-- AlterTable: make PatientProfile.diagnosis optional with empty string default
ALTER TABLE "PatientProfile" ALTER COLUMN "diagnosis" SET DEFAULT '';
