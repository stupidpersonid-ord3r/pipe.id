import type { FastifyInstance } from "fastify";
import { dbQuery } from "../db/client.js";
import { requireUser } from "../auth.js";

const guard = async (req: any, reply: any) => {
  const id = await requireUser(req);

  if (!id) {
    reply.status(401).send({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required.",
      },
    });

    return null;
  }

  return id;
};

async function accountScope(uid: string, request: any) {
  const id = (request.query as any)?.accountId;

  if (
    id &&
    (
      await dbQuery(
        "select 1 from accounts where id=$1 and user_id=$2",
        [id, uid]
      )
    ).rowCount === 0
  ) {
    return { error: "ACCOUNT_NOT_FOUND" };
  }

  return { id };
}

export async function analyticsRoutes(app: FastifyInstance) {
  // --------------------------------------------------
  // OVERVIEW
  // --------------------------------------------------
  app.get("/analytics/overview", async (req, reply) => {
    const uid = await guard(req, reply);
    if (!uid) return;

    const s = await accountScope(uid, req);

    if ("error" in s) {
      return reply.status(404).send({
        error: {
          code: "ACCOUNT_NOT_FOUND",
          message: "Account not found.",
        },
      });
    }

    const vals: any[] = [uid];

    const filter = s.id ? " and account_id=$2" : "";

    if (s.id) {
      vals.push(s.id);
    }

    const r = await dbQuery<any>(
      `
        select
          count(*)::int as total,
          count(*) filter(where result='WIN')::int as wins,
          count(*) filter(where result='LOSS')::int as losses,
          count(*) filter(where result='BREAKEVEN')::int as breakeven,
          coalesce(sum(pnl),0)::numeric as pnl,
          coalesce(
            sum(case when pnl > 0 then pnl else 0 end),
            0
          )::numeric as gross_profit,
          coalesce(
            abs(sum(case when pnl < 0 then pnl else 0 end)),
            0
          )::numeric as gross_loss,
          coalesce(avg(pnl),0)::numeric as average_pnl
        from trades
        where user_id=$1${filter}
      `,
      vals
    );

    const x = r.rows[0];

    return {
      data: {
        total_trades: x.total,
        wins: x.wins,
        losses: x.losses,
        breakeven: x.breakeven,
        win_rate: x.total
          ? Number(((x.wins / x.total) * 100).toFixed(2))
          : 0,
        total_pnl: Number(x.pnl),
        average_pnl: Number(x.average_pnl),
        profit_factor: Number(x.gross_loss)
          ? Number(
              (
                Number(x.gross_profit) /
                Number(x.gross_loss)
              ).toFixed(4)
            )
          : null,
      },
    };
  });

  // --------------------------------------------------
  // EQUITY
  // --------------------------------------------------
  app.get("/analytics/equity", async (req, reply) => {
    const uid = await guard(req, reply);
    if (!uid) return;

    const s = await accountScope(uid, req);

    if ("error" in s) {
      return reply.status(404).send({
        error: {
          code: "ACCOUNT_NOT_FOUND",
          message: "Account not found.",
        },
      });
    }

    const vals: any[] = [uid];

    let filter = "";

    if (s.id) {
      filter = " and account_id=$2";
      vals.push(s.id);
    }

    const r = await dbQuery<any>(
      `
        select
          trade_date as date,
          coalesce(sum(pnl),0)::numeric as pnl
        from trades
        where user_id=$1${filter}
        group by trade_date
        order by trade_date
      `,
      vals
    );

    let equity = 0;

    return {
      data: r.rows.map((x: any) => {
        equity += Number(x.pnl);

        return {
          date: x.date,
          equity: Number(equity.toFixed(2)),
          pnl: Number(x.pnl),
        };
      }),
    };
  });

  // --------------------------------------------------
  // MONTHLY
  // --------------------------------------------------
  app.get("/analytics/monthly", async (req, reply) => {
    const uid = await guard(req, reply);
    if (!uid) return;

    const s = await accountScope(uid, req);

    if ("error" in s) {
      return reply.status(404).send({
        error: {
          code: "ACCOUNT_NOT_FOUND",
          message: "Account not found.",
        },
      });
    }

    const vals: any[] = [uid];

    let filter = "";

    if (s.id) {
      filter = " and account_id=$2";
      vals.push(s.id);
    }

    const r = await dbQuery<any>(
      `
        select
          to_char(trade_date,'YYYY-MM') as month,
          count(*)::int as trades,
          count(*) filter(where result='WIN')::int as wins,
          coalesce(sum(pnl),0)::numeric as pnl
        from trades
        where user_id=$1${filter}
        group by 1
        order by 1
      `,
      vals
    );

    return {
      data: r.rows.map((x: any) => ({
        ...x,
        pnl: Number(x.pnl),
        win_rate: x.trades
          ? Number(((x.wins / x.trades) * 100).toFixed(2))
          : 0,
      })),
    };
  });

  // --------------------------------------------------
  // PSYCHOLOGY
  // --------------------------------------------------
  app.get("/analytics/psychology", async (req, reply) => {
    const uid = await guard(req, reply);
    if (!uid) return;

    const r = await dbQuery<any>(
      `
        select
          psychology,
          count(*)::int as trades,
          count(*) filter(where result='WIN')::int as wins,
          coalesce(sum(pnl),0)::numeric as pnl
        from trades
        where user_id=$1
        group by psychology
        order by psychology
      `,
      [uid]
    );

    return {
      data: r.rows.map((x: any) => ({
        ...x,
        pnl: Number(x.pnl),
        win_rate: x.trades
          ? Number(((x.wins / x.trades) * 100).toFixed(2))
          : 0,
      })),
    };
  });

  // --------------------------------------------------
  // STRATEGIES / PAIRS
  // --------------------------------------------------
  for (const [path, field] of [
    ["strategies", "strategy"],
    ["pairs", "pair"],
  ] as const) {
    app.get(`/analytics/${path}`, async (req, reply) => {
      const uid = await guard(req, reply);
      if (!uid) return;

      const s = await accountScope(uid, req);

      if ("error" in s) {
        return reply.status(404).send({
          error: {
            code: "ACCOUNT_NOT_FOUND",
            message: "Account not found.",
          },
        });
      }

      const vals: any[] = [uid];

      let filter = "";

      if (s.id) {
        filter = " and account_id=$2";
        vals.push(s.id);
      }

      const col =
        field === "strategy"
          ? "coalesce(strategy,'Unknown')"
          : "pair";

      const r = await dbQuery<any>(
        `
          select
            ${col} as name,
            count(*)::int as trades,
            count(*) filter(where result='WIN')::int as wins,
            coalesce(sum(pnl),0)::numeric as pnl
          from trades
          where user_id=$1${filter}
          group by 1
          order by pnl desc
        `,
        vals
      );

      return {
        data: r.rows.map((x: any) => ({
          ...x,
          pnl: Number(x.pnl),
          win_rate: x.trades
            ? Number(((x.wins / x.trades) * 100).toFixed(2))
            : 0,
        })),
      };
    });
  }
}