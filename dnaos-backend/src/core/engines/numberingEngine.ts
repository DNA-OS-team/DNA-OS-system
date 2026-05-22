export type DocumentTypeCode = "ORD" | "BOQ" | "QT" | "PO" | "INV" | "RCP" | "PV" | "PMT";

export type BuildDocumentNoInput = {
  projectNo: string;
  documentType: DocumentTypeCode;
  date: Date;
  sequence: number;
};

const sequenceWidth = 4;
const documentSequenceWidth = 3;

export function buildProjectNo(year: number, sequence: number) {
  return `PRJ-${year}-${padSequence(sequence, sequenceWidth)}`;
}

export function buildDocumentGroupNo(year: number, sequence: number) {
  return `GRP-${year}-${padSequence(sequence, sequenceWidth)}`;
}

export function buildDocumentNo(input: BuildDocumentNoInput) {
  return [
    input.projectNo,
    input.documentType,
    formatDateKey(input.date),
    padSequence(input.sequence, documentSequenceWidth)
  ].join("-");
}

export function getNextSequenceFromNumber(
  value: string | null | undefined,
  fallbackSequence = 1
) {
  if (!value) {
    return fallbackSequence;
  }

  const lastSegment = value.split("-").at(-1);
  const currentSequence = Number(lastSegment);

  if (!Number.isInteger(currentSequence) || currentSequence < 0) {
    return fallbackSequence;
  }

  return currentSequence + 1;
}

export function getProjectNoPrefix(year: number) {
  return `PRJ-${year}-`;
}

export function getDocumentGroupNoPrefix(year: number) {
  return `GRP-${year}-`;
}

export function getDocumentNoPrefix(projectNo: string, documentType: DocumentTypeCode, date: Date) {
  return `${projectNo}-${documentType}-${formatDateKey(date)}-`;
}

function padSequence(sequence: number, width: number) {
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error("Sequence must be a positive integer");
  }

  return String(sequence).padStart(width, "0");
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}
