import { describe, expect, it } from "vitest";
import { splitNovelIntoChapters } from "../src/shared/chaptering";

describe("splitNovelIntoChapters", () => {
  it("keeps explicit Chinese chapter headings and extracts chapter bodies", () => {
    const chapters = splitNovelIntoChapters(`
第一章 雨夜来信
林澈在雨声里收到一封没有署名的信。

第二章 旧车站
沈遥在废弃车站等他，手里握着一枚铜钥匙。

第三章 天台灯塔
两人登上天台，看见城市中心升起蓝色光柱。
`);

    expect(chapters).toHaveLength(3);
    expect(chapters[0]).toMatchObject({
      index: 1,
      title: "第一章 雨夜来信"
    });
    expect(chapters[1].body).toContain("废弃车站");
    expect(chapters[2].body).toContain("蓝色光柱");
  });

  it("splits plain prose into three balanced draft chapters when headings are missing", () => {
    const source = [
      "林澈推开档案室的门，灰尘在灯下像雪。",
      "沈遥把失踪名单摊在桌上，圈出三个相同的地址。",
      "凌晨的广播突然响起，播报的是十年前的天气。",
      "他们沿着旧地铁线向北，发现墙上刻着今天的日期。",
      "终点站没有列车，只有一台仍在运行的投影仪。",
      "投影里的人抬头看向镜头，说出了林澈的名字。"
    ].join("\n\n");

    const chapters = splitNovelIntoChapters(source);

    expect(chapters).toHaveLength(3);
    expect(chapters.map((chapter) => chapter.title)).toEqual([
      "第一章 自动分章",
      "第二章 自动分章",
      "第三章 自动分章"
    ]);
    expect(chapters.every((chapter) => chapter.body.length > 10)).toBe(true);
  });
});
