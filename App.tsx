import _ from "lodash";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useMemo, useState } from "react";
import MagicCrest from "./components/MagicCrest";
import { CORRUPTION_LEVELS } from "./constants";
import { ActivityState, CharacterState, CrestLevel } from "./types";

declare global {
  interface Window {
    waitGlobalInitialized?: <T>(global: string) => Promise<T>;
    getAllVariables?: () => Record<string, any>;
    errorCatched?: <T extends any[], U>(
      fn: (...args: T) => U,
    ) => (...args: T) => U;
  }
}

const safeWaitGlobalInitialized = async (n: string) =>
  window.waitGlobalInitialized ? window.waitGlobalInitialized(n) : null;
const safeGetAllVariables = () =>
  window.getAllVariables ? window.getAllVariables() : {};
const safeErrorCatched = <T extends any[], U>(fn: (...args: T) => U) =>
  window.errorCatched ? window.errorCatched(fn) : fn;

const App: React.FC = () => {
  const [data, setData] = useState<CharacterState | null>(null);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"status" | "gear" | "env">(
    "status",
  );

  const update = safeErrorCatched(() => {
    const v = safeGetAllVariables();
    const env = _.get(v, "stat_data.当前环境", {});
    const ly = _.get(v, "stat_data.凌月", {});
    const mem = _.get(v, "stat_data.记忆", []);

    // 将记忆列表按时间降序排列
    const sortedMem = Array.isArray(mem)
      ? [...mem].sort((a, b) => String(b.时间).localeCompare(String(a.时间)))
      : [];

    setData({
      env: {
        日期: env.日期 || "2024年05月20日",
        星期: env.星期 || "星期一",
        时间: env.时间 || "14:30",
        地点: env.地点 || "未知区域",
        周遭环境: env.周遭环境 || "无特殊描述",
      },
      lingyue: {
        心理状态: {
          堕落度: _.get(ly, "心理状态.堕落度", 0),
          发情度: _.get(ly, "心理状态.发情度", 0),
          表面伪装: _.get(ly, "心理状态.表面伪装", "维持着冷静的表象"),
          真实想法: _.get(ly, "心理状态.真实想法", "..."),
        },
        身体开发度: {
          乳房: _.get(ly, "身体开发度.乳房", 0),
          乳头: _.get(ly, "身体开发度.乳头", 0),
          尿道: _.get(ly, "身体开发度.尿道", 0),
          阴蒂: _.get(ly, "身体开发度.阴蒂", 0),
          阴道: _.get(ly, "身体开发度.阴道", 0),
          子宫: _.get(ly, "身体开发度.子宫", 0),
          肛门: _.get(ly, "身体开发度.肛门", 0),
        },
        外在着装: {
          上衣: _.get(ly, "外在着装.上衣", "整洁的白衬衫"),
          下装: _.get(ly, "外在着装.下装", "黑色包臀裙"),
          内衣: _.get(ly, "外在着装.内衣", "丝绸内衣"),
          袜子: _.get(ly, "外在着装.袜子", "黑色丝袜"),
          鞋子: _.get(ly, "外在着装.鞋子", "黑色高跟鞋"),
        },
        淫纹契约: {
          当前阶段: _.get(ly, "淫纹契约.当前阶段", 0) as CrestLevel,
          发光状态: _.get(ly, "淫纹契约.发光状态", "沉寂") as ActivityState,
          局部温度: _.get(ly, "淫纹契约.局部温度", 36.0),
        },
        私密装备: _.get(ly, "私密装备", []),
      },
      记忆: sortedMem,
    });
  });

  useEffect(() => {
    safeWaitGlobalInitialized("Mvu").then(() => {
      update();
      const i = setInterval(update, 3000);
      return () => clearInterval(i);
    });
  }, []);

  const corruptionInfo = useMemo(() => {
    if (!data) return CORRUPTION_LEVELS[0];
    const val = data.lingyue.心理状态.堕落度;
    return (
      CORRUPTION_LEVELS.find((l) => val >= l.min && val <= l.max) ||
      CORRUPTION_LEVELS[CORRUPTION_LEVELS.length - 1]
    );
  }, [data]);

  const getTemperatureStyle = (temp: number) => {
    const min = 36;
    const max = 45;
    const ratio = Math.max(0, Math.min(1, (temp - min) / (max - min)));
    const r = Math.round(34 + ratio * (239 - 34));
    const g = Math.round(197 + ratio * (68 - 197));
    const b = Math.round(94 + ratio * (68 - 94));
    return { color: `rgb(${r}, ${g}, ${b})` };
  };

  if (!data)
    return (
      <div className="p-8 text-rose-300 animate-pulse font-black text-xl italic">
        凌月状态载入中...
      </div>
    );

  const isBranded = data.lingyue.淫纹契约.当前阶段 > 0;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-[14px] overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-rose-100 p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-200">
            <i className="fas fa-crown"></i>
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tighter uppercase leading-none">
              凌月 · LING YUE
            </h1>
            <p className="text-sm font-bold text-rose-400 mt-1 uppercase tracking-widest">
              {corruptionInfo.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-slate-400 leading-none">
              {data.env.日期}
            </p>
            <p className="text-xs font-black text-rose-500">
              {data.env.时间} {data.env.星期}
            </p>
          </div>
          <button
            onClick={() => setMemoryOpen(true)}
            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
          >
            <i className="fas fa-history"></i>
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 flex flex-col items-center max-w-4xl mx-auto w-full">
        {/* Detailed Stats Section */}
        <section className="w-full flex flex-col gap-4">
          {/* Tabs */}
          <div className="flex bg-white p-1 rounded-2xl border border-rose-50 shadow-sm">
            {[
              { id: "status", label: "状态", icon: "fa-heartbeat" },
              { id: "crest", label: "淫纹", icon: "fa-fire-flame-curved" },
              { id: "env", label: "环境", icon: "fa-map-marker-alt" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all ${
                  activeTab === tab.id
                    ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                    : "text-slate-400 hover:bg-rose-50"
                }`}
              >
                <i className={`fas ${tab.icon}`}></i>
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "status" && (
              <motion.div
                key="status"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                {/* Psychology */}
                <div className="bg-white p-5 rounded-3xl border border-rose-50 shadow-sm flex flex-col gap-5">
                  <h3 className="text-base font-black text-slate-700 flex items-center gap-2">
                    <i className="fas fa-brain text-rose-400"></i> 心理状态
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      {
                        label: "堕落度",
                        val: data.lingyue.心理状态.堕落度,
                        max: 1000,
                        color: "bg-purple-600",
                        isPercent: false,
                      },
                      {
                        label: "发情度",
                        val: data.lingyue.心理状态.发情度,
                        max: 100,
                        color: "bg-rose-500",
                        isPercent: true,
                      },
                    ].map((s) => (
                      <div key={s.label} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-end px-1">
                          <span className="text-xs font-black text-slate-500">
                            {s.label}
                          </span>
                          <span className="text-sm font-black text-slate-700 font-mono">
                            {s.val}
                            {s.isPercent ? "%" : `/1000`}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(s.val / s.max) * 100}%` }}
                            className={`h-full ${s.color} shadow-sm`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-3 mt-2">
                    <div className="bg-rose-50/50 p-3 rounded-2xl border border-rose-100/50">
                      <p className="text-sm font-black text-rose-400 uppercase tracking-widest mb-1">
                        表面伪装
                      </p>
                      <p className="text-xs font-bold text-slate-600 italic">
                        “{data.lingyue.心理状态.表面伪装}”
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">
                        真实想法
                      </p>
                      <p className="text-xs font-bold text-slate-500 leading-relaxed">
                        {data.lingyue.心理状态.真实想法}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Body Development Card */}
                <div className="bg-white p-5 rounded-3xl border border-rose-50 shadow-sm flex flex-col gap-5">
                  <h3 className="text-base font-black text-slate-700 flex items-center gap-2">
                    <i className="fas fa-female text-rose-400"></i> 身体开发
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    {[
                      { label: "乳房", val: data.lingyue.身体开发度.乳房 },
                      { label: "乳头", val: data.lingyue.身体开发度.乳头 },
                      { label: "尿道", val: data.lingyue.身体开发度.尿道 },
                      { label: "阴蒂", val: data.lingyue.身体开发度.阴蒂 },
                      { label: "阴道", val: data.lingyue.身体开发度.阴道 },
                      { label: "子宫", val: data.lingyue.身体开发度.子宫 },
                      { label: "肛门", val: data.lingyue.身体开发度.肛门 },
                    ].map((part) => (
                      <div key={part.label} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-end px-1">
                          <span className="text-xs font-black text-slate-500">
                            {part.label}
                          </span>
                          <span className="text-xs font-black text-rose-500 font-mono">
                            {part.val}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${part.val}%` }}
                            className="h-full bg-rose-400 shadow-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gear (Moved here) */}
                <div className="bg-white p-5 rounded-3xl border border-rose-50 shadow-sm flex flex-col gap-4">
                  <h3 className="text-base font-black text-slate-700 flex items-center gap-2">
                    <i className="fas fa-microchip text-rose-400"></i> 私密装备
                  </h3>
                  {data.lingyue.私密装备.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {data.lingyue.私密装备.map((gear, idx) => (
                        <div
                          key={idx}
                          className="bg-rose-50/30 p-4 rounded-2xl border border-rose-100/50 flex flex-col gap-3"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="bg-rose-500 text-white text-sm font-black px-2 py-0.5 rounded-full">
                                {gear.佩戴部位}
                              </span>
                              <h4 className="text-sm font-black text-slate-700">
                                {gear.装备名称}
                              </h4>
                            </div>
                            <span className="text-sm font-black text-rose-400 uppercase tracking-tighter">
                              {gear.运行状态}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center px-1">
                              <span className="text-sm font-black text-slate-400">
                                刺激强度
                              </span>
                              <span className="text-xs font-black text-rose-500">
                                {gear.刺激强度}/10
                              </span>
                            </div>
                            <div className="h-1.5 bg-white rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${(gear.刺激强度 / 10) * 100}%`,
                                }}
                                className="h-full bg-rose-400"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-xs font-bold text-slate-400">
                        目前没有任何私密装备
                      </p>
                    </div>
                  )}
                </div>

                {/* Clothing */}
                <div className="bg-white p-5 rounded-3xl border border-rose-50 shadow-sm flex flex-col gap-4">
                  <h3 className="text-base font-black text-slate-700 flex items-center gap-2">
                    <i className="fas fa-tshirt text-rose-400"></i> 外在着装
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      {
                        label: "上衣",
                        val: data.lingyue.外在着装.上衣,
                        icon: "fa-shirt",
                      },
                      {
                        label: "下装",
                        val: data.lingyue.外在着装.下装,
                        icon: "fa-socks",
                      },
                      {
                        label: "内衣",
                        val: data.lingyue.外在着装.内衣,
                        icon: "fa-heart",
                      },
                      {
                        label: "袜子",
                        val: data.lingyue.外在着装.袜子,
                        icon: "fa-shoe-prints",
                      },
                      {
                        label: "鞋子",
                        val: data.lingyue.外在着装.鞋子,
                        icon: "fa-shoe-prints",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-rose-50/30 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-400 text-xs">
                          <i className={`fas ${item.icon}`}></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black text-slate-400 leading-none">
                            {item.label}
                          </p>
                          <p className="text-xs font-bold text-slate-700 mt-1">
                            {item.val}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "crest" && (
              <motion.div
                key="crest"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                {/* Magic Crest Card */}
                <div className="bg-white p-5 rounded-3xl border border-rose-50 shadow-sm flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="text-base font-black text-slate-700 flex items-center gap-2">
                      <i className="fas fa-fire-alt text-rose-400"></i> 淫纹契约
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100 flex items-center gap-1.5">
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">
                          LV.
                        </span>
                        <span className="text-sm font-black text-rose-500">
                          {data.lingyue.淫纹契约.当前阶段}
                        </span>
                      </div>
                      <div className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                        <span className="text-sm font-black text-rose-400">
                          {data.lingyue.淫纹契约.发光状态}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                        <i className="fas fa-thermometer-half text-rose-500 text-sm"></i>
                        <span
                          className="text-sm font-black"
                          style={getTemperatureStyle(
                            data.lingyue.淫纹契约.局部温度,
                          )}
                        >
                          {data.lingyue.淫纹契约.局部温度.toFixed(1)}°C
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center bg-slate-50/50 p-1 rounded-2xl border border-slate-100 min-h-[240px] overflow-hidden">
                    <div className="relative w-full max-w-[320px] sm:max-w-[360px] aspect-square flex-shrink-0 flex items-center justify-center">
                      <MagicCrest
                        level={data.lingyue.淫纹契约.当前阶段}
                        activity={data.lingyue.淫纹契约.发光状态}
                        isBranded={isBranded}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "env" && (
              <motion.div
                key="env"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                <div className="bg-white p-5 rounded-3xl border border-rose-50 shadow-sm flex flex-col gap-5">
                  <h3 className="text-base font-black text-slate-700 flex items-center gap-2">
                    <i className="fas fa-globe-asia text-rose-400"></i> 当前环境
                  </h3>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4 bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50">
                      <div className="w-12 h-12 rounded-xl bg-white flex flex-col items-center justify-center shadow-sm">
                        <span className="text-sm font-black text-rose-400 leading-none">
                          {data.env.星期}
                        </span>
                        <span className="text-lg font-black text-slate-700 leading-none mt-1">
                          {data.env.时间.split(":")[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-700">
                          {data.env.日期}
                        </p>
                        <p className="text-sm font-black text-rose-500">
                          {data.env.时间}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        {
                          label: "当前地点",
                          val: data.env.地点,
                          icon: "fa-map-marker-alt",
                        },
                        {
                          label: "周遭环境",
                          val: data.env.周遭环境,
                          icon: "fa-wind",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-rose-400 text-xs shadow-sm">
                            <i className={`fas ${item.icon}`}></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-black text-slate-400 leading-none uppercase">
                              {item.label}
                            </p>
                            <p className="text-xs font-bold text-slate-700 mt-1.5 leading-relaxed">
                              {item.val}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Memory Modal */}
      <AnimatePresence>
        {memoryOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMemoryOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                  <i className="fas fa-history text-rose-500"></i> 记忆回廊
                </h2>
                <button
                  onClick={() => setMemoryOpen(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white transition-all"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {data.记忆.length > 0 ? (
                  data.记忆.map((entry, idx) => (
                    <div
                      key={idx}
                      className="relative pl-6 border-l-2 border-rose-100 py-1"
                    >
                      <div className="absolute left-[-5px] top-2 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                      <p className="text-sm font-black text-rose-400 uppercase mb-1">
                        {entry.时间}
                      </p>
                      <h4 className="text-sm font-black text-slate-800 mb-1">
                        {entry.名称}
                      </h4>
                      <p className="text-xs font-bold text-slate-500 leading-relaxed">
                        {entry.内容}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center">
                    <i className="fas fa-feather-pointed text-slate-200 text-4xl mb-4"></i>
                    <p className="text-sm font-bold text-slate-400">
                      尚未留下任何记忆点...
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
          transform-origin: center;
        }
      `,
        }}
      />
    </div>
  );
};

export default App;
