import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabaseServer';
import {
  buildTimeRanges,
  computeFromDate,
  runMetric,
  seedLastKnownFromPriorScore,
  type MetricRow,
} from '../../../lib/historical-metrics';

export const dynamic = 'force-dynamic';

type ActivityRow = {
  day: string | null;
  co2_kg: number | string | null;
  water_l: number | string | null;
  energy_kwh: number | string | null;
};

type ScoreRow = {
  day: string | null;
  score: number | string | null;
};

function toScoreRows(rows: ScoreRow[]): MetricRow[] {
  return rows.map((row) => ({ day: row.day, score: row.score }));
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'you have not logged in' }, { status: 401 });
    }

    const fromDate = computeFromDate();

    const [activitiesResult, scoresResult, priorScoreResult] = await Promise.all([
      supabase
        .from('eco_activities')
        .select('day, co2_kg, water_l, energy_kwh')
        .eq('user_id', user.id)
        .gte('day', fromDate)
        .returns<ActivityRow[]>(),
      supabase
        .from('eco_score_log')
        .select('day, score')
        .eq('user_id', user.id)
        .gte('day', fromDate)
        .returns<ScoreRow[]>(),
      supabase
        .from('eco_score_log')
        .select('day, score')
        .eq('user_id', user.id)
        .lt('day', fromDate)
        .order('day', { ascending: false })
        .limit(1)
        .returns<ScoreRow[]>(),
    ]);

    if (activitiesResult.error) throw activitiesResult.error;
    if (scoresResult.error) throw scoresResult.error;
    if (priorScoreResult.error) throw priorScoreResult.error;

    const activityRows = activitiesResult.data ?? [];
    const scoreRows = toScoreRows(scoresResult.data ?? []);
    const priorRows = toScoreRows(priorScoreResult.data ?? []);
    const ranges = buildTimeRanges();

    const ecoScoreSeed =
      priorRows.length > 0
        ? seedLastKnownFromPriorScore(priorRows, fromDate, 'score')
        : seedLastKnownFromPriorScore(scoreRows, fromDate, 'score');

    const resp = {
      co2_kg: runMetric(activityRows, ranges, {
        metricField: 'co2_kg',
        aggregation: 'sum',
        decimals: 2,
      }),
      water_l: runMetric(activityRows, ranges, {
        metricField: 'water_l',
        aggregation: 'sum',
        decimals: 1,
      }),
      energy_kwh: runMetric(activityRows, ranges, {
        metricField: 'energy_kwh',
        aggregation: 'sum',
        decimals: 2,
      }),
      eco_score: runMetric(scoreRows, ranges, {
        metricField: 'score',
        aggregation: 'latest_value',
        decimals: 0,
        carryForward: true,
        initialLastKnown: ecoScoreSeed,
      }),
    };

    return NextResponse.json(resp);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'server error';
    console.error('API Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
