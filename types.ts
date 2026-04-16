export type ActivityState = "沉寂" | "呼吸" | "充能" | "满溢" | "绽放";

export type CrestLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface MemoryEntry {
  名称: string;
  内容: string;
  时间: string;
}

export interface PrivateGear {
  佩戴部位: string;
  装备名称: string;
  运行状态: string;
  刺激强度: number;
}

export interface CharacterState {
  env: {
    日期: string;
    星期: string;
    时间: string;
    地点: string;
    周遭环境: string;
  };
  lingyue: {
    心理状态: {
      堕落度: number;
      发情度: number;
      表面伪装: string;
      真实想法: string;
    };
    身体开发度: {
      乳房: number;
      乳头: number;
      尿道: number;
      阴蒂: number;
      阴道: number;
      子宫: number;
      肛门: number;
    };
    外在着装: {
      上衣: string;
      下装: string;
      内衣: string;
      袜子: string;
      鞋子: string;
    };
    淫纹契约: {
      当前阶段: CrestLevel;
      发光状态: ActivityState;
      局部温度: number;
    };
    私密装备: PrivateGear[];
  };
  记忆: MemoryEntry[];
}
