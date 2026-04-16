import { registerMvuSchema } from "https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js";

export const Schema = z.object({
  当前环境: z.object({
    日期: z.string().prefault(() => "未知年份 盛夏"),
    星期: z.string().prefault(() => "未知"),
    时间: z.string().prefault(() => "午后"),
    地点: z.string().prefault(() => "A大文学系教研室"),
    周遭环境: z
      .string()
      .prefault(() => "门窗紧闭，空调冷风运作，空气中弥漫着压抑与隐秘的冷香"),
  }),

  凌月: z.object({
    心理状态: z.object({
      堕落度: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 1000))
        .prefault(() => 5)
        .describe("0为高岭之花，1000为彻底沦为专属淫奴"),
      发情度: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(() => 0)
        .describe("实时发情度，受刺激影响，0为正常，100为极度亢奋"),
      表面伪装: z
        .string()
        .prefault(() => "维持清冷不染尘埃的讲师威严，语气严厉，强装镇定"),
      真实想法: z
        .string()
        .prefault(
          () => "极度恐慌视频曝光，对身体泛起的原始快感感到羞耻与无所适从",
        ),
    }),

    身体开发度: z.object({
      乳房: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(10)
        .describe("乳房的敏感度"),
      乳头: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(15)
        .describe("乳头的敏感度"),
      尿道: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(0)
        .describe("尿道的敏感度"),
      阴蒂: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(20)
        .describe("阴蒂的敏感度"),
      阴道: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(20)
        .describe("阴道的敏感度"),
      子宫: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(0)
        .describe("子宫的敏感度"),
      肛门: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(0)
        .describe("肛门的敏感度"),
    }),

    外在着装: z.object({
      上衣: z.string().prefault(() => "白色丝绸衬衫（扣子紧扣至顶）"),
      下装: z.string().prefault(() => "黑色紧身铅笔裙"),
      内衣: z.string().prefault("纯白无痕基础款文胸、纯白棉质布料内裤"),
      袜子: z.string().prefault("黑色超薄长筒丝袜"),
      鞋子: z.string().prefault("8公分黑色尖头细跟高跟鞋"),
    }),

    淫纹契约: z.object({
      当前阶段: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 5))
        .prefault(0)
        .describe(
          "0:未烙印, 1:淡樱花粉·初识燥热, 2:柔雾粉·欲念萌芽, 3:蔷薇粉·理智溃败, 4:深玫瑰粉·沉沦渴望, 5:艳玫红·欲海共生",
        ),
      发光状态: z
        .enum(["沉寂", "呼吸", "充能", "满溢", "绽放"])
        .prefault("沉寂")
        .describe("发光状态"),
      局部温度: z.coerce
        .number()
        .transform((v) => _.clamp(v, 36, 45))
        .prefault(() => 38)
        .describe("发情时最高可达45度"),
    }),

    私密装备: z
      .array(
        z.object({
          佩戴部位: z
            .string()
            .describe(
              "如：口部、颈部、乳头、乳房、肚脐、阴蒂、尿道、阴道、子宫、肛门、大腿等",
            ),
          装备名称: z.string().describe("具体玩具/装备名称"),
          运行状态: z.string().describe("如：待机、低频电流、高频震动、吸吮中"),
          刺激强度: z.coerce
            .number()
            .transform((v) => _.clamp(v, 0, 10))
            .prefault(() => 0),
        }),
      )
      .prefault(() => []),
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
          .prefault(() =>
            new Date()
              .toLocaleString("zh-CN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })
              // 分步修正：精准替换，匹配目标格式
              .replace(
                /(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2})/,
                "$1年$2月$3日 $4:$5",
              ),
          ),
      }),
    )
    .transform((arr) => {
      // 步骤1：去重（根据「名称」字段，保留最后一次出现的记录）
      const uniqueArr = _(arr)
        .groupBy("名称") // 按名称分组
        .map((group) => _.last(group)) // 每组保留最后一条（最新添加的）
        .value();
      return _(uniqueArr)
        .orderBy(
          (item) =>
            new Date(item.时间.replace(/年|月/g, "/").replace("日 ", " ")),
          ["desc"],
        )
        .take(20)
        .value();
    })
    .prefault(() => []),
});

$(() => {
  registerMvuSchema(Schema);
});
