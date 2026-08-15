import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import Notification from "@/db/models/Notification";
import Department from "@/db/models/Department";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";

type AggregatedItem = {
  _id: string | { date: string; departmentId: mongoose.Types.ObjectId };
  total: number;
  pending: number;
  sending: number;
  sent: number;
  delivered: number;
  opened: number;
  failed: number;
  retrying: number;
  cancelled: number;
};

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // 1. Verify Admin cookie
    const adminSession = await getAdminSession();
    if (!adminSession || adminSession.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // 2. Extract URL Filters
    const searchParams = req.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "15", 10);
    const channel = searchParams.get("channel") || "all";
    const departmentId = searchParams.get("departmentId") || "all";

    // 3. Build the dynamic Match Query (Filters)
    const matchStage: {
      createdAt: { $gte: Date };
      channel?: string;
      departmentId?: mongoose.Types.ObjectId;
    } = {
      createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
    };

    if (channel !== "all") {
      matchStage.channel = channel;
    }

    if (
      departmentId !== "all" &&
      mongoose.Types.ObjectId.isValid(departmentId)
    ) {
      matchStage.departmentId = new mongoose.Types.ObjectId(departmentId);
    }

    const statusCounters = {
      total: { $sum: 1 },
      pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
      sending: { $sum: { $cond: [{ $eq: ["$status", "sending"] }, 1, 0] } },
      sent: { $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] } },
      delivered: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
      opened: { $sum: { $cond: [{ $eq: ["$status", "opened"] }, 1, 0] } },
      failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
      retrying: { $sum: { $cond: [{ $eq: ["$status", "retrying"] }, 1, 0] } },
      cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
    };

    ///////////////////////////////////////////
    //Global Timeline (All Departments combined)
    ////////////////////////////////////////////
    const globalTimelineData: AggregatedItem[] = await Notification.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          ...statusCounters,
        },
      },
      { $sort: { _id: 1 } },
    ]);

    //Department Timeline (Grouped by Date AND Department)

    const deptTimelineData: AggregatedItem[] = await Notification.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            departmentId: "$departmentId",
          },
          ...statusCounters,
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    // Fetch Department Names to map IDs to Names
    const departments = await Department.find(
      { active: true },
      "name _id",
    ).sort({ name: 1 });

    // Helper function to format timeline and calculate summary
    const processTimeline = (
      dataArray: AggregatedItem[],
      idExtractor: (item: AggregatedItem) => string,
    ) => {
      let total = 0;
      let totalSent = 0;
      let totalDeliveredOrOpened = 0;

      const timeline = dataArray.map((item) => {
        total += item.total;
        totalSent += item.sent + item.delivered + item.opened;
        totalDeliveredOrOpened += item.delivered + item.opened;

        return {
          date: idExtractor(item),
          pending: item.pending,
          sending: item.sending,
          sent: item.sent,
          delivered: item.delivered,
          opened: item.opened,
          failed: item.failed,
          retrying: item.retrying,
          cancelled: item.cancelled,
        };
      });

      const deliverabilityRate =
        total > 0 ? Math.round((totalDeliveredOrOpened / total) * 100) : 0;

      return { summary: { total, totalSent, deliverabilityRate }, timeline };
    };

    const globalData = processTimeline(
      globalTimelineData,
      (item) => item._id as string,
    );

    // Process Department Data
    const departmentResults = departments.map((dept) => {
      const thisDeptData = deptTimelineData.filter((item) => {
        // We know for the department aggregation, _id is an object
        const idObj = item._id as { departmentId: mongoose.Types.ObjectId };
        return idObj.departmentId.toString() === dept._id.toString();
      });

      const processed = processTimeline(thisDeptData, (item) => {
        const idObj = item._id as { date: string };
        return idObj.date;
      });

      return {
        _id: dept._id.toString(),
        name: dept.name,
        summary: processed.summary,
        timeline: processed.timeline,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        global: globalData,
        departments: departmentResults,
      },
    });
  } catch (error) {
    console.error("Metrics API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
