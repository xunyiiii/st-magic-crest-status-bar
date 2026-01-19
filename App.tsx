import _ from "lodash";
import React, { useEffect, useMemo, useState } from "react";
import MagicCrest from "./components/MagicCrest";
import { CORE_GEAR_GROUPS, CORRUPTION_LEVELS, UI_DESIGN } from "./constants";
import { CharacterState } from "./types";

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
  const [memData, setMemData] = useState<Record<string, string>>({});

  const update = safeErrorCatched(() => {
    const v = safeGetAllVariables();
    const ly = _.get(v, "stat_data.凌月", {});
    const common = _.get(v, "stat_data", {});
    const env = _.get(v, "stat_data.环境", {});
    const mem = _.get(v, "stat_data.记忆", {});

    setMemData(mem || {});
    setData({
      stats: {
        堕落度: _.get(ly, "状态.堕落度", 0),
        羞耻感: _.get(ly, "状态.羞耻感", 0),
        敏感度: _.get(ly, "状态.敏感度", 0),
        体力: _.get(ly, "状态.体力", 0),
        当前阶段: _.get(ly, "状态.当前阶段", 1),
      },
      tattoo: {
        进化等级: _.get(ly, "淫纹.进化等级", 0),
        当前活性: _.get(ly, "淫纹.当前活性", "沉寂"),
        温度反馈: _.get(ly, "淫纹.温度反馈", 37.0),
      },
      gear: {
        体内: _.get(ly, "装备.体内", {}),
        穿刺: _.get(ly, "装备.穿刺", {}),
        刺激模组: _.get(ly, "装备.刺激模组", { 部署位置: {}, 控制模式: "关" }),
        连接系统: _.get(ly, "装备.连接系统", {
          项圈: null,
          全身锁链: false,
          运作模式: "待机",
          震动等级: 0,
        }),
        公开展示: _.get(ly, "装备.公开展示", {}),
        兽化组件: _.get(ly, "装备.兽化组件", { 尾巴: null, 伪装延展: false }),
      },
      disguise: _.get(ly, "伪装", {}),
      psych: _.get(ly, "心理", {}),
      env: {
        location: common.地点 || "未知",
        time: common.时间 || "--:--",
        周围人群: env.周围人群 || "无",
        环境噪音: env.环境噪音 || "平静",
        安全等级: env.安全等级 || "高",
      },
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
    const val = data.stats.堕落度;
    return (
      CORRUPTION_LEVELS.find((l) => val >= l.min && val <= l.max) ||
      CORRUPTION_LEVELS[0]
    );
  }, [data]);

  const getTemperatureStyle = (temp: number) => {
    const min = 37;
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
        凌月状态
      </div>
    );

  const isBranded = data.tattoo.进化等级 > 0;
  const isSwarmActive =
    _.get(data.gear, "刺激模组.部署位置.星尘蜂群") ||
    _.get(data.gear, "星尘蜂群") === "部署";

  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen bg-slate-50 font-sans text-[14px]">
      {/* 左右分栏布局 - 1:1 占比 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 左侧：统合卡片 */}
        <div
          className="glass-card flex flex-col overflow-hidden"
          style={{ background: UI_DESIGN.CARD_BG }}
        >
          {/* 头部装饰 */}
          <div className="p-5 pb-2 border-b-2 border-rose-100 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <i className="fas fa-microchip text-rose-400"></i>
              <h2 className="text-lg font-black text-slate-700 uppercase tracking-tighter">
                凌月状态
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-rose-500 text-white px-3 py-0.5 rounded-full text-lg font-black italic">
                阶段 {data.stats.当前阶段}
              </span>
              <span className="font-mono font-black text-rose-400">
                {data.env.time}
              </span>
            </div>
          </div>

          <div className="p-5 flex flex-col gap-6 overflow-y-auto">
            {/* 状态区 - 强制进度条高度 28px */}
            <div className="text-base grid grid-cols-2 gap-x-10 gap-y-4 items-start">
              {[
                {
                  label: "堕落度",
                  val: data.stats.堕落度,
                  color: "bg-purple-600",
                  extra: corruptionInfo.label,
                },
                {
                  label: "羞耻感",
                  val: data.stats.羞耻感,
                  color: "bg-rose-500",
                },
                {
                  label: "敏感度",
                  val: data.stats.敏感度,
                  color: "bg-pink-500",
                },
                {
                  label: "体力值",
                  val: data.stats.体力,
                  color: "bg-emerald-500",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col gap-1.5 h-auto overflow-hidden shrink-0"
                >
                  <div className="flex justify-between font-black text-slate-600 leading-none items-center mb-0.5">
                    <span className="flex items-center gap-1.5 truncate">
                      {s.label}
                      {s.extra && (
                        <span className="text-base text-rose-400 border border-rose-200 px-1 rounded font-bold whitespace-nowrap">
                          {s.extra}
                        </span>
                      )}
                    </span>
                    <span className="font-mono">{Math.round(s.val)}%</span>
                  </div>
                  {/* 使用 inline-style 配合 min/max height 绝对锁定 28px */}
                  <div
                    className="track bg-slate-200/50 relative overflow-hidden shrink-0"
                    style={{
                      height: "28px",
                      minHeight: "28px",
                      maxHeight: "28px",
                      width: "100%",
                    }}
                  >
                    <div
                      className={`fill ${s.color} absolute left-0 top-0`}
                      style={{ width: `${s.val}%`, height: "28px" }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 环境与伪装区 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/40 p-4 rounded-xl border border-rose-50 flex flex-col gap-2">
                <h4 className="text-lg font-black text-rose-300 uppercase tracking-widest">
                  环境
                </h4>
                <div className="text-base flex flex-col gap-1 font-bold text-slate-600">
                  <span className="flex items-center gap-2 truncate">
                    <i className="fas fa-map-marker-alt w-4 text-center"></i>
                    {data.env.location}
                  </span>
                  <span className="flex items-center gap-2 truncate">
                    <i className="fas fa-users w-4 text-center"></i>
                    {data.env.周围人群}
                  </span>
                  <span className="flex items-center gap-2 truncate">
                    <i className="fas fa-volume-up w-4 text-center"></i>
                    环境噪音: {data.env.环境噪音}
                  </span>
                  <span className="flex items-center gap-2 text-rose-400">
                    <i className="fas fa-shield-alt w-4 text-center"></i>
                    安全等级: {data.env.安全等级}
                  </span>
                </div>
              </div>
              <div className="bg-white/40 p-4 rounded-xl border border-rose-50 flex flex-col gap-2">
                <h4 className="text-lg font-black text-rose-300 uppercase tracking-widest">
                  伪装
                </h4>
                <div className="text-base flex flex-col gap-1 font-bold text-slate-600">
                  <span className="truncate">
                    当前着装: {data.disguise.当前着装 || "常服"}
                  </span>
                  <span className="truncate">
                    表面状态: {data.disguise.表面状态 || "平静"}
                  </span>
                  <span className="truncate text-rose-500">
                    生理破绽: {data.disguise.生理破绽 || "无"}
                  </span>
                  <span className="truncate text-rose-500">
                    当前借口: {data.disguise.当前借口 || "暂无借口掩饰..."}
                  </span>
                </div>
              </div>
            </div>

            {/* 心理独白区 */}
            <div className="bg-white/30 p-4 rounded-xl border border-rose-100/50 flex flex-col gap-3 shrink-0">
              <h4 className="text-lg font-black text-rose-300 uppercase tracking-widest border-b border-rose-100/30 pb-1">
                心理
              </h4>
              <div className="flex flex-col gap-1">
                <span className="text-base font-black text-slate-500 uppercase tracking-tighter ">
                  内心独白: “{data.psych.内心独白 || "......"}”
                </span>
              </div>
              <div className="flex justify-between items-center mt-1 pt-1 border-t border-rose-50">
                <span className="text-base font-bold text-slate-300 italic">
                  公众印象: {data.psych.公众印象 || "普通讲师"}
                </span>
              </div>
            </div>

            {/* 装备部署区 */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-black text-rose-300 uppercase tracking-widest">
                  私密装备
                </h4>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {CORE_GEAR_GROUPS.map((g) => (
                  <div key={g.id} className="flex flex-col gap-2">
                    <span className="text-base font-black text-slate-400 flex items-center gap-1.5 truncate">
                      <i className={`fas ${g.icon}`}></i>
                      {g.label}
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {g.slots.map((s) => {
                        const v = _.get(data.gear, s.path);
                        const active = v && v !== "无" && v !== false;
                        return (
                          <div
                            key={s.label}
                            className={`px-2 py-1.5 rounded-lg border-2 text-base flex justify-between items-center ${active ? "bg-white border-rose-200 text-rose-500 font-bold shadow-sm" : "bg-slate-50/20 border-slate-100 text-slate-300"}`}
                          >
                            <span>{s.label}</span>
                            <span className="truncate max-w-[50px] opacity-70 italic">
                              {active
                                ? typeof v === "string"
                                  ? v.split("·").pop()
                                  : "OK"
                                : "-"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* 刺激模组模块 */}
              <div className="mt-2 bg-white/60 p-3 rounded-xl border border-rose-100 shadow-sm shrink-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-black text-slate-500 italic uppercase">
                    <i className="fas fa-bolt mr-1"></i>刺激模组
                  </span>
                  <span className="text-base font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">
                    控制模式: {data.gear.刺激模组.控制模式 || "关"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(data.gear.刺激模组.部署位置).length > 0 ? (
                    Object.entries(data.gear.刺激模组.部署位置).map(
                      ([pos, item]) => (
                        <span
                          key={pos}
                          className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-base font-black border border-rose-200"
                        >
                          {pos}: {item}
                        </span>
                      ),
                    )
                  ) : (
                    <span className="text-slate-300 italic text-base">
                      未检测到模组负载...
                    </span>
                  )}
                </div>
              </div>

              {/* 兽化组件模块 */}
              <div className="bg-white/60 p-3 rounded-xl border border-rose-100 shadow-sm shrink-0">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-black text-slate-500 italic uppercase">
                    <i className="fas fa-paw mr-1"></i>兽化组件
                  </span>
                  <div className="flex gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base text-slate-400 font-black">
                        尾巴:
                      </span>
                      <span
                        className={`text-base font-bold ${data.gear.兽化组件.尾巴 ? "text-rose-500" : "text-slate-300"}`}
                      >
                        {data.gear.兽化组件.尾巴 || "NONE"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-base text-slate-400 font-black">
                        伪装延展:
                      </span>
                      <span
                        className={`text-base font-bold ${data.gear.兽化组件.伪装延展 ? "text-green-500" : "text-slate-300"}`}
                      >
                        {data.gear.兽化组件.伪装延展 ? "ACTIVE" : "OFF"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 连接系统底部控制行 */}
              <div className="flex flex-col gap-2 px-4 py-3 bg-slate-900/5 rounded-xl border-t-2 border-rose-200 mt-2 shrink-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <i className="fas fa-link text-rose-300 text-lg"></i>
                    <div className="flex items-center gap-1">
                      <span className="text-base font-black text-slate-400">
                        项圈:
                      </span>
                      <span
                        className={`text-base font-bold ${data.gear.连接系统.项圈 ? "text-rose-600" : "text-slate-300"}`}
                      >
                        {data.gear.连接系统.项圈 || "未佩戴"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-base font-black text-slate-400">
                        全身锁链:
                      </span>
                      <span
                        className={`text-base font-bold ${data.gear.连接系统.全身锁链 ? "text-rose-600" : "text-slate-300"}`}
                      >
                        {data.gear.连接系统.全身锁链 ? "已开启" : "关闭"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div className="flex items-center gap-1">
                      <span className="text-base font-black text-slate-400">
                        运作模式:
                      </span>
                      <span className="text-base font-black text-rose-500 uppercase">
                        {data.gear.连接系统.运作模式}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-base font-black text-slate-400">
                        震动等级:
                      </span>
                      <span className="text-base font-black text-rose-500">
                        ⚡{data.gear.连接系统.震动等级}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：淫纹卡片 - 1:1 占比 */}
        <div className="flex flex-col gap-4 h-full">
          <div
            className="glass-card flex-grow flex flex-col items-center justify-between p-6 relative overflow-hidden"
            style={{ background: UI_DESIGN.CARD_BG }}
          >
            <div className="text-xl w-full flex justify-between items-center text-rose-300 font-black tracking-widest z-10 shrink-0">
              <div className="flex items-center gap-2">
                <span>淫纹</span>
                <div className="relative flex items-center justify-center ml-1 drop-shadow-sm">
                  <i className="fas fa-heart text-rose-500 text-2xl opacity-90"></i>
                  <span className="absolute text-base font-black text-white pb-0.5">
                    {data.tattoo.进化等级}
                  </span>
                </div>
              </div>
              <span className="text-base not-italic bg-rose-400 text-white px-2 py-0.5 rounded shadow-sm uppercase">
                {isBranded ? "" : "未烙印"}
              </span>
            </div>

            <div className="relative w-full flex-grow flex items-center justify-center z-10 overflow-hidden">
              <MagicCrest
                level={data.tattoo.进化等级}
                activity={data.tattoo.当前活性}
                isBranded={isBranded}
              />
              <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-rose-200/40 blur-[2px] shadow-inner hidden"></div>
            </div>

            <div className="w-full grid grid-cols-2 gap-4 border-t-2 border-rose-200/50 pt-6 mt-2 z-10 shrink-0">
              <div className="flex flex-col items-center">
                <span className="text-base font-black text-slate-400 uppercase">
                  活性
                </span>
                <span className="text-2xl font-black text-rose-500 drop-shadow-md">
                  {data.tattoo.当前活性}
                </span>
              </div>
              <div className="flex flex-col items-center border-l-2 border-rose-100">
                <span className="text-base font-black text-slate-400 uppercase">
                  温度
                </span>
                <span
                  className="text-2xl font-mono font-black transition-colors duration-1000"
                  style={getTemperatureStyle(data.tattoo.温度反馈)}
                >
                  {data.tattoo.温度反馈.toFixed(1)}°C
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部记忆卡片 */}
      <div
        className="glass-card overflow-hidden shrink-0"
        style={{ background: UI_DESIGN.CARD_BG }}
      >
        <button
          onClick={() => setMemoryOpen(!memoryOpen)}
          className="w-full flex items-center justify-between p-5 hover:bg-rose-50/50 transition-colors"
        >
          <div className="flex items-center gap-3 font-black text-slate-600 text-lg">
            <i className="fas fa-history text-rose-400"></i>
            Chronicle Memory / 里程碑
          </div>
          <i
            className={`fas fa-chevron-up transition-transform duration-300 ${memoryOpen ? "" : "rotate-180"}`}
          ></i>
        </button>
        {memoryOpen && (
          <div className="p-5 pt-0 grid grid-cols-2 gap-4 max-h-[250px] overflow-y-auto">
            {Object.entries(memData).length > 0 ? (
              Object.entries(memData).map(([id, desc]) => (
                <div
                  key={id}
                  className="bg-white/60 p-4 rounded-xl border-l-4 border-rose-400 shadow-sm flex flex-col gap-1 hover:bg-white transition-all hover:scale-[1.01]"
                >
                  <span className="font-mono text-base text-rose-300 font-black uppercase tracking-tighter">
                    Event ID: {id}
                  </span>
                  <p className="font-bold text-slate-600 text-base">{desc}</p>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 text-slate-300 italic font-black text-base">
                Empty chronicles...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
