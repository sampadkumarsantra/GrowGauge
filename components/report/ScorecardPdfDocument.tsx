import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import { ChecklistItem } from '@/lib/checklist';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    color: '#1E2A1F',
    fontSize: 10,
    lineHeight: 1.4,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#3F6B45',
    paddingBottom: 14,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleGroup: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#2F3E5C',
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 10,
    color: '#565F58',
  },
  badgeContainer: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 8,
    color: '#747D74',
    marginTop: 4,
  },
  heroScoreCard: {
    backgroundColor: '#E4EBE1',
    borderColor: '#3F6B45',
    borderWidth: 1,
    borderRadius: 2,
    padding: 14,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLeft: {
    flex: 1,
  },
  fpoHeading: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#2F3E5C',
    marginBottom: 2,
  },
  fpoMeta: {
    fontSize: 9,
    color: '#565F58',
  },
  scoreRight: {
    alignItems: 'center',
    minWidth: 110,
    paddingLeft: 12,
  },
  scoreNumber: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: '#C1861A',
  },
  bandLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    marginTop: 2,
  },
  bandStrong: {
    backgroundColor: '#3F6B45',
    color: '#ffffff',
  },
  bandModerate: {
    backgroundColor: '#2F3E5C',
    color: '#ffffff',
  },
  bandDeveloping: {
    backgroundColor: '#1E2A1F',
    color: '#ffffff',
  },
  bandEarly: {
    backgroundColor: '#A85736',
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1E2A1F',
    borderBottomWidth: 1,
    borderBottomColor: '#D8D6C6',
    paddingBottom: 4,
    marginBottom: 8,
    marginTop: 10,
  },
  table: {
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D8D6C6',
    borderRadius: 2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F0E6',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRowHeader: {
    backgroundColor: '#F1F0E6',
    borderBottomWidth: 1,
    borderBottomColor: '#D8D6C6',
    fontFamily: 'Helvetica-Bold',
  },
  colFactor: { width: '36%' },
  colMetric: { width: '38%' },
  colWeight: { width: '12%', textAlign: 'center' },
  colScore: { width: '14%', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  narrativeBox: {
    backgroundColor: '#F1F0E6',
    borderColor: '#D8D6C6',
    borderWidth: 1,
    borderRadius: 2,
    padding: 10,
    marginBottom: 14,
  },
  narrativeText: {
    fontSize: 9,
    color: '#565F58',
    lineHeight: 1.45,
  },
  suggestionItem: {
    flexDirection: 'row',
    marginBottom: 5,
    paddingLeft: 4,
  },
  bullet: {
    width: 10,
    color: '#2F3E5C',
    fontFamily: 'Helvetica-Bold',
  },
  suggestionText: {
    flex: 1,
    fontSize: 9,
    color: '#565F58',
  },
  checklistItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 4,
  },
  checklistBox: {
    width: 11,
    height: 11,
    borderWidth: 1,
    borderColor: '#3F6B45',
    marginRight: 6,
    marginTop: 1,
  },
  checklistText: {
    flex: 1,
    fontSize: 8.5,
    color: '#565F58',
    lineHeight: 1.3,
  },
  footer: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#D8D6C6',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disclaimer: {
    fontSize: 7,
    color: '#747D74',
    maxWidth: '75%',
    lineHeight: 1.3,
  },
  attribution: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#3F6B45',
    textAlign: 'right',
  },
});

export interface ScorecardPdfProps {
  brandIcon?: string;
  submission: {
    fpoName: string;
    state: string;
    district: string;
    registrationType: string;
    activeMembers: number;
    revenueYear1: number;
    activeBuyersCount: number;
    contractSalesPct: number;
  };
scoreResult: {
      overallScore: number;
      band: string;
      factorScores: {
        membership: number;
        revenueStability: number;
        costEfficiency: number;
        diversification: number;
        marketLinkage: number;
        governance: number;
      };
      narrativeSummary: string;
      suggestions: string[];
      dataCompletenessFlag: boolean;
      calculatedAt?: string;
    };
    checklist?: ChecklistItem[];
  };

export const ScorecardPdfDocument: React.FC<ScorecardPdfProps> = ({
  brandIcon,
  submission,
  scoreResult,
  checklist,
}) => {
  const getBandStyle = (band: string) => {
    switch (band) {
      case 'Strong':
        return styles.bandStrong;
      case 'Moderate':
        return styles.bandModerate;
      case 'Developing':
        return styles.bandDeveloping;
      default:
        return styles.bandEarly;
    }
  };

  const factors = [
    {
      name: 'Membership Strength',
      model: 'Member scale (200 threshold) + 2-Yr Retention Rate',
      weight: '15%',
      score: scoreResult.factorScores.membership,
    },
    {
      name: 'Revenue Stability',
      model: 'Coefficient of Variation (CV = σ / μ, Farm Income Analysis)',
      weight: '20%',
      score: scoreResult.factorScores.revenueStability,
    },
    {
      name: 'Cost Efficiency',
      model: 'Operating Ratio (OPEX / Gross Revenue, Farm Business Analysis)',
      weight: '20%',
      score: scoreResult.factorScores.costEfficiency,
    },
    {
      name: 'Product Diversification',
      model: 'Herfindahl-Hirschman Index (HHI = Σs², Industrial Economics)',
      weight: '15%',
      score: scoreResult.factorScores.diversification,
    },
    {
      name: 'Market Linkage Strength',
      model: "Off-taker base, contracts & Farmer's Share of Consumer Rupee",
      weight: '15%',
      score: scoreResult.factorScores.marketLinkage,
    },
    {
      name: 'Governance & Compliance',
      model: 'Statutory compliance: Audit, Annual General Meeting, Board Meetings',
      weight: '15%',
      score: scoreResult.factorScores.governance,
    },
  ];

  const formattedDate = scoreResult.calculatedAt
    ? new Date(scoreResult.calculatedAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleGroup}>
            <Text style={styles.mainTitle}>GrowGauge — FPO Credit-Readiness Scorecard</Text>
            <Text style={styles.subTitle}>
              Objective Socioeconomic Diagnostic for Institutional Credit Evaluation
            </Text>
          </View>
          <View style={styles.badgeContainer}>
            {brandIcon ? (
              <Image src={brandIcon} style={{ width: 44, height: 44 }} />
            ) : null}
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#2F3E5C' }}>
              GROWGAUGE PLATFORM
            </Text>
            <Text style={styles.dateText}>Generated: {formattedDate}</Text>
          </View>
        </View>

        {/* Hero Score Card */}
        <View style={styles.heroScoreCard}>
          <View style={styles.scoreLeft}>
            <Text style={styles.fpoHeading}>{submission.fpoName}</Text>
            <Text style={styles.fpoMeta}>
              {submission.district}, {submission.state} | {submission.registrationType}
            </Text>
            <Text style={[styles.fpoMeta, { marginTop: 3 }]}>
              Active Shareholders: {submission.activeMembers} | Commercial Off-takers: {submission.activeBuyersCount}
            </Text>
            {scoreResult.dataCompletenessFlag && (
              <Text style={{ fontSize: 8, color: '#A85736', marginTop: 4, fontFamily: 'Helvetica-Bold' }}>
                * Limited financial history (&lt; 3 years). Score will refine as operational history builds.
              </Text>
            )}
          </View>
          <View style={styles.scoreRight}>
            <Text style={styles.scoreNumber}>{scoreResult.overallScore.toFixed(1)}</Text>
            <Text style={[styles.bandLabel, getBandStyle(scoreResult.band)]}>
              {scoreResult.band} Band
            </Text>
          </View>
        </View>

        {/* Narrative */}
        <Text style={styles.sectionTitle}>Executive Diagnostic Summary</Text>
        <View style={styles.narrativeBox}>
          <Text style={styles.narrativeText}>{scoreResult.narrativeSummary}</Text>
        </View>

        {/* Factor Breakdown Table */}
        <Text style={styles.sectionTitle}>Economic & Statistical Indicator Breakdown</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableRowHeader]}>
            <Text style={styles.colFactor}>Indicator</Text>
            <Text style={styles.colMetric}>Economic / Statistical Foundation</Text>
            <Text style={styles.colWeight}>Weight</Text>
            <Text style={styles.colScore}>Score</Text>
          </View>
          {factors.map((f, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.colFactor, { fontFamily: 'Helvetica-Bold' }]}>{f.name}</Text>
              <Text style={styles.colMetric}>{f.model}</Text>
              <Text style={styles.colWeight}>{f.weight}</Text>
              <Text style={styles.colScore}>{f.score.toFixed(1)}/100</Text>
            </View>
          ))}
        </View>

        {/* Suggestions */}
        <Text style={styles.sectionTitle}>Priority Credit-Readiness Action Plan</Text>
        <View style={{ marginBottom: 16 }}>
          {scoreResult.suggestions.map((s, idx) => (
            <View key={idx} style={styles.suggestionItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.suggestionText}>{s}</Text>
            </View>
          ))}
        </View>

        {/* Bank-Ready Document Checklist */}
        {checklist && checklist.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Bank-Ready Application Document Checklist</Text>
            <Text style={[styles.fpoMeta, { marginBottom: 8 }]}>
              Documents typically required for an institutional loan application by {submission.registrationType}s.
              Confirm the exact list with your lending branch.
            </Text>
            <View style={{ marginBottom: 14 }}>
              {checklist.map((item) => (
                <View key={item.id} style={styles.checklistItem}>
                  <View style={styles.checklistBox} />
                  <Text style={styles.checklistText}>
                    {item.label}
                    {item.required ? '' : '  (recommended)'}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.disclaimer}>
            Notice: This scorecard is an objective self-assessment diagnostic based on empirical economic models
            (Weighted Composite Index method). It does not guarantee credit approval and serves as a standardized
            pre-screening reference for institutional lenders and CBBOs.
          </Text>
          <Text style={styles.attribution}>
            Methodology by{'\n'}ICAR-IARI Jharkhand
          </Text>
        </View>
      </Page>
    </Document>
  );
};
