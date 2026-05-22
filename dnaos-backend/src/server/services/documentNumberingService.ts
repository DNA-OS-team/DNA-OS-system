import type { DocumentTypeCode } from "../../core/engines/numberingEngine.js";
import {
  buildDocumentGroupNo,
  buildDocumentNo,
  buildProjectNo,
  getDocumentGroupNoPrefix,
  getDocumentNoPrefix,
  getNextSequenceFromNumber,
  getProjectNoPrefix
} from "../../core/engines/numberingEngine.js";
import { getPrisma } from "../db/prisma.js";

export async function generateProjectNo(date = new Date()) {
  const prisma = getPrisma();
  const year = date.getFullYear();
  const prefix = getProjectNoPrefix(year);
  const latestProject = await prisma.project.findFirst({
    where: {
      projectNo: {
        startsWith: prefix
      }
    },
    orderBy: {
      projectNo: "desc"
    }
  });

  return buildProjectNo(year, getNextSequenceFromNumber(latestProject?.projectNo));
}

export async function generateDocumentGroupNo(date = new Date()) {
  const prisma = getPrisma();
  const year = date.getFullYear();
  const prefix = getDocumentGroupNoPrefix(year);
  const latestGroup = await prisma.documentGroup.findFirst({
    where: {
      groupNo: {
        startsWith: prefix
      }
    },
    orderBy: {
      groupNo: "desc"
    }
  });

  return buildDocumentGroupNo(year, getNextSequenceFromNumber(latestGroup?.groupNo));
}

export async function generateDocumentNo(
  projectNo: string,
  documentType: DocumentTypeCode,
  date = new Date()
) {
  const prisma = getPrisma();
  const prefix = getDocumentNoPrefix(projectNo, documentType, date);
  const latestReference = await prisma.documentReference.findFirst({
    where: {
      documentId: {
        startsWith: prefix
      }
    },
    orderBy: {
      documentId: "desc"
    }
  });

  return buildDocumentNo({
    projectNo,
    documentType,
    date,
    sequence: getNextSequenceFromNumber(latestReference?.documentId)
  });
}
