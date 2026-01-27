import { registerMvuSchema } from "https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js";

export const Schema = z.object({
  // --- 基础时空 ---
  日期: z.string().prefault("2024年5月20日"),
  时间: z.string().prefault("14:30"),
  地点: z.string().prefault("大学综合楼-A402教研室"),

  // --- 核心角色：凌月 ---
  凌月: z.object({
    // 1. 核心指标体系
    状态: z.object({
      堕落度: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(0)
        .describe("决定演变阶段的关键变量"),
      羞耻感: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(90)
        .describe("随堕落度升高而转化为快感"),
      敏感度: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(5)
        .describe("身体开发的程度"),
      体力: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(90),
      当前阶段: z.coerce
        .number()
        .transform((v) => _.clamp(v, 1, 5))
        .prefault(1)
        .describe(
          "1:隐秘的异物, 2:失控的低烧, 3:血肉的共鸣, 4:华丽的蛛网, 5:完美的祭品",
        ),
    }),

    // 2. 淫纹系统 (对应 system name="淫纹·契约")
    淫纹: z.object({
      进化等级: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 5))
        .prefault(0)
        .describe("淫纹进化阶段，决定外观与能力"),
      当前活性: z
        .enum(["沉寂", "呼吸", "充能", "满溢", "绽放"])
        .prefault("沉寂")
        .describe("光效与热度状态"),
      温度反馈: z.coerce
        .number()
        .prefault(37)
        .describe("腹部温度, 常态37，发情45"),
    }),

    // 3. 晶烁圣枷·装备栏 (对应 wardrobe name="私密装备·晶烁圣枷")
    装备: z.object({
      // 体内填充模组 (透明监牢)
      体内: z.object({
        阴道: z.string().nullable().prefault(null),
        后庭: z.string().nullable().prefault(null),
        尿道: z.string().nullable().prefault(null),
      }),

      // 穿刺与饰品 (肉体勋章)
      穿刺: z.object({
        乳头: z
          .string()
          .nullable()
          .prefault(null)
          .describe("例如：无 / 乳夹·晨露之吻 / 乳环·极乐回响"),
        肚脐: z
          .string()
          .nullable()
          .prefault(null)
          .describe("是否佩戴[脐钉·枢纽之心]"),
        阴蒂: z
          .string()
          .nullable()
          .prefault(null)
          .describe("无 / 阴蒂扣·花间蜜语 / 阴蒂环·潮汐之心"),
      }),

      刺激模组: z.object({
        部署位置: z
          .array(
            // 数组单个元素的结构定义
            z.object({
              点位: z
                .string()
                .describe(
                  "锚点装备/身体部位名称（如阴蒂环、乳环、宫颈塞·月之泪、阴蒂、乳头、G点、肛门、阴道穹窿）",
                ),
              震动: z.boolean().describe("是否处于震动中").default(false),
            }),
          )
          .prefault(() => []),
        控制模式: z
          .enum(["待机", "随机游走", "声控惩罚", "心跳同频"])
          .prefault("待机"),
      }),

      // 连接系统 (圣洁锁链)
      连接系统: z.object({
        项圈: z.string().nullable().prefault(null),
        全身锁链: z
          .string()
          .nullable()
          .prefault(null)
          .describe("圣洁锁链系统是否完全闭合连接"),
        运作模式: z
          .enum(["待机", "快感路由", "警告与剥夺", "随机传导", "铃声陷阱"])
          .prefault("待机"),
        震动等级: z.coerce
          .number()
          .transform((v) => _.clamp(v, 0, 5))
          .prefault(0),
      }),

      // 公开展示套件 (华服下的密语)
      公开展示: z.object({
        胸针: z
          .string()
          .nullable()
          .prefault(null)
          .describe("是否佩戴[胸针·雪境之心]"),
        腰链: z
          .string()
          .nullable()
          .prefault(null)
          .describe("是否佩戴[腰链·坠落星河]"),
        饰链: z.string().nullable().prefault(null).describe("例如: 大腿环链"),
      }),

      // 扩展配件 (兽化组件)
      兽化组件: z.object({
        尾巴: z.string().nullable().prefault(null).describe("是否佩戴尾巴组件"),
        伪装延展: z
          .boolean()
          .prefault(false)
          .describe("尾巴是否通过内部道具连接"),
      }),
    }),

    // 4. 外在伪装与崩坏 (对应 system name="隐秘崩坏")
    伪装: z.object({
      当前着装: z
        .string()
        .prefault("[禁欲标杆·经典白衬衫]")
        .describe("对应衣橱ID名称"),
      表面状态: z
        .string()
        .prefault("正在教研室整理下午课程的资料")
        .describe("例如：正在讲课 / 正在与未婚夫用餐"),
      生理破绽: z
        .string()
        .prefault("无")
        .describe("例如：面色潮红 / 双腿发抖 / 眼神涣散"),
      当前借口: z
        .string()
        .prefault("无")
        .describe("用于掩饰异样的借口，如'低烧'、'静电'"),
    }),

    // 5. 心理与认知 (体现表里反差)
    心理: z.object({
      内心独白: z
        .string()
        .describe("此时此刻最真实的淫荡或恐惧想法")
        .prefault("..."),
      公众印象: z
        .string()
        .describe("学生或NPC眼中的高岭之花形象")
        .prefault("以严谨和禁欲著称的美女讲师"),
    }),
  }),

  // --- 世界与NPC互动 ---
  环境: z.object({
    周围人群: z
      .string()
      .prefault("无")
      .describe("例如：满座的学生 / 未婚夫姚北律 / 家族长辈"),
    噪音: z.string().describe("可能触发声控惩罚的声音环境"),
    安全等级: z
      .enum(["高", "中", "低"])
      .describe("高(安全私密空间)/中(半私密空间)/低(易暴露的公共场合)"),
  }),

  // --- 记忆/历史记录 (标准 MVU 格式) ---
  记忆: z
    .array(
      z.object({
        名称: z.string().describe("记忆唯一名称（里程碑事件标识）"),
        内容: z.string().describe("记忆的详细描述内容"),
        时间: z
          .string()
          .describe("记忆发生的时间，格式：YYYY年MM月DD日 HH:MM")
          .prefault(() => Date.now()),
      }),
    )
    .transform((obj) => {
      // 步骤1：去重（根据「名称」字段，保留最后一次出现的记录）
      const uniqueArr = _(arr)
        .groupBy("名称") // 按名称分组
        .map((group) => _.last(group)) // 每组保留最后一条（最新添加的）
        .value();
      return _(uniqueArr)
        .entries()
        .sortBy((item) => item.时间)
        .takeRight(20)
        .value();
    })
    .prefault(() => []),
});

$(() => {
  registerMvuSchema(Schema);
});
