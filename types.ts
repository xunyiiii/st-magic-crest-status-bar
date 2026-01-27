export type ActivityState = "沉寂" | "呼吸" | "充能" | "满溢" | "绽放" | "常态";

export type CrestLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface MemoryEntry {
  名称: string;
  内容: string;
  时间: string;
}

export interface DeploymentLocation {
  点位: string;
  震动: boolean;
}

export interface CharacterState {
  stats: {
    堕落度: number;
    羞耻感: number;
    敏感度: number;
    体力: number;
    当前阶段: number;
  };
  tattoo: {
    进化等级: CrestLevel;
    当前活性: ActivityState;
    温度反馈: number;
  };
  gear: {
    体内: { 阴道: string | null; 后庭: string | null; 尿道: string | null };
    穿刺: { 乳头: string | null; 肚脐: string | null; 阴蒂: string | null };
    刺激模组: {
      部署位置: DeploymentLocation[];
      控制模式: "待机" | "随机游走" | "声控惩罚" | "心跳同频" | string;
    };
    连接系统: {
      项圈: string | null;
      全身锁链: boolean;
      运作模式: string;
      震动等级: number;
    };
    公开展示: { 胸针: string | null; 腰链: string | null; 饰链: string | null };
    兽化组件: { 尾巴: string | null; 伪装延展: boolean };
  };
  disguise: {
    当前着装: string;
    表面状态: string;
    生理破绽: string;
    当前借口: string;
  };
  psych: {
    内心独白: string;
    公众印象: string;
  };
  env: {
    location: string;
    date: string;
    time: string;
    周围人群: string;
    噪音: string;
    安全等级: string;
  };
}
