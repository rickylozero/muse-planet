import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  BookOpenText,
  Compass,
  HeartPulse,
  Landmark,
  Newspaper,
  Orbit,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ContentCard } from "@/components/content-card";
import { PlanetIllustration } from "@/components/planet-illustration";
import { SectionHeading } from "@/components/section-heading";
import { SiteHeader } from "@/components/site-header";
import { getHomeContent } from "@/lib/content";

type Topic = {
  number: string;
  label: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  tone: "sage" | "clay" | "oat";
};

const topics: Topic[] = [
  {
    number: "01",
    label: "EDUCATION PATHS",
    title: "升學遊學",
    description: "從教育資訊到遊學探索，替每一個成長階段多留一點從容。",
    Icon: Compass,
    tone: "sage",
  },
  {
    number: "02",
    label: "LITTLE STEPS",
    title: "學習技巧",
    description: "把學習拆成可實踐的小步驟，陪孩子找到自己的節奏。",
    Icon: Sparkles,
    tone: "clay",
  },
  {
    number: "03",
    label: "HEALTH TIPS",
    title: "健康 Tips",
    description: "從身心健康到親子情緒，讓照顧與成長都被好好看見。",
    Icon: HeartPulse,
    tone: "oat",
  },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const homeContent = await getHomeContent();

  return (
    <div className="site-frame">
      <SiteHeader />

      <main>
        <section className="page-shell hero hero--planet" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              專為香港家長打造的智慧教育平台
            </p>
            <h1 className="hero-title" id="hero-title">
              讓資訊有方向，
              <span className="hero-title-highlight">陪孩子自在探索成長。</span>
            </h1>
            <p className="hero-description">
              教育快訊、升學情報與親子日常，沿著清楚可靠的資訊軌道，陪孩子自在探索。
            </p>
            <div className="hero-actions">
              <a className="button-primary" href="#topics">
                探索成長主題
                <ArrowDown size={16} strokeWidth={1.8} aria-hidden="true" />
              </a>
              <a className="button-quiet" href="#promise">
                了解平台理念
                <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden="true" />
              </a>
            </div>
            <p className="hero-footnote">
              <Orbit size={16} strokeWidth={1.7} aria-hidden="true" />
              有來源可循，陪伴更有餘裕
            </p>
          </div>

          <div className="hero-visual">
            <PlanetIllustration className="hero-planet-illustration" />
            <div className="hero-planet-badge hero-planet-badge--news">
              <span className="hero-planet-badge-icon"><Newspaper size={17} aria-hidden="true" /></span>
              <span><strong>每日快訊</strong><small>來源清晰可追溯</small></span>
            </div>
            <div className="hero-planet-badge hero-planet-badge--official">
              <span className="hero-planet-badge-icon"><Landmark size={17} aria-hidden="true" /></span>
              <span><strong>教育局專區</strong><small>官方資訊好整理</small></span>
            </div>
            <span className="hero-visual-index" aria-hidden="true">
              MUSE PLANET · GROW WITH WISDOM
            </span>
          </div>
        </section>

        <section className="page-shell daily-section" id="today" aria-labelledby="daily-title">
          <SectionHeading
            headingId="daily-title"
            icon={Newspaper}
            kicker="01 · DAILY NOTES"
            title="今日教育快訊"
            description="重要消息一眼掌握，每則都看得見資料來源。"
            sideNote="給忙碌日常的一點好整理"
          />
          {homeContent.dailyNewsUnavailable ? (
            <ContentEmpty
              title="今日快訊暫時無法載入"
              description="內容服務目前未能回應，請稍後再試。"
              unavailable
            />
          ) : homeContent.dailyNews.length ? (
            <div className="content-card-list">
              {homeContent.dailyNews.map((item) => (
                <ContentCard key={item.id} item={item} label="今日快訊" />
              ))}
            </div>
          ) : (
            <ContentEmpty
              title="目前暫無已核實的最新快訊"
              description="此處只會呈現 24 小時內仍有效、已發布且可見的來源摘要。"
            />
          )}
        </section>

        <section
          className="page-shell edb-section"
          id="edb"
          aria-labelledby="edb-title"
        >
          <SectionHeading
            headingId="edb-title"
            icon={Landmark}
            kicker="02 · EDB OFFICIAL"
            title="教育局專區"
            description="教育局官方資訊與原始來源，清楚收在一起。"
            sideNote="官方消息 · 來源可追溯"
          />
          {homeContent.edbOfficialUnavailable ? (
            <ContentEmpty
              title="教育局資訊暫時無法載入"
              description="內容服務目前未能回應，請稍後再試。"
              unavailable
            />
          ) : homeContent.edbOfficial.length ? (
            <div className="content-card-list content-card-list--official">
              {homeContent.edbOfficial.map((item) => (
                <ContentCard key={item.id} item={item} label="教育局官方資訊" />
              ))}
            </div>
          ) : (
            <ContentEmpty
              title="目前未有已發布的教育局資訊"
              description="草稿與未公開內容不會出現在前台。"
            />
          )}
        </section>

        <section className="topics-section" id="topics" aria-labelledby="topics-title">
          <div className="page-shell">
            <SectionHeading
              headingId="topics-title"
              icon={Compass}
              kicker="03 · FIND YOUR TOPIC"
              title="每個成長階段，都有值得看的事"
              description="升學、學習與健康，挑選家庭此刻最關心的方向。"
              sideNote="挑一個此刻最關心的方向"
            />
            <div className="topic-grid">
              {topics.map(({ number, label, title, description, Icon, tone }) => (
                <article className="topic-card" data-tone={tone} key={number}>
                  <div className="topic-card-top">
                    <span className="topic-number">{number} / 03</span>
                    <span className="topic-icon" aria-hidden="true">
                      <Icon size={21} strokeWidth={1.7} />
                    </span>
                  </div>
                  <p className="topic-label">{label}</p>
                  <h3>{title}</h3>
                  <p className="topic-description">{description}</p>
                  <span className="topic-arrow" aria-hidden="true">
                    <ArrowUpRight size={17} strokeWidth={1.7} />
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="page-shell promise-section" id="promise" aria-labelledby="promise-title">
          <div className="promise-intro">
            <p className="eyebrow">
              <span className="section-heading-icon"><ShieldCheck size={14} aria-hidden="true" /></span>
              OUR EDITORIAL PROMISE
            </p>
            <h2 id="promise-title">
              好資訊，不只是讀到；
              <span>還要知道它從哪裡來。</span>
            </h2>
          </div>
          <div className="promise-note">
            <span className="promise-icon" aria-hidden="true">
              <Orbit size={20} strokeWidth={1.6} />
            </span>
            <p>
              以來源透明、清楚易讀與尊重家庭步調為整理原則。把判斷資訊的線索交還給家長，讓陪伴回到日常。
            </p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-shell footer-inner">
          <Link className="footer-brand" href="/">
            <Orbit size={18} strokeWidth={1.6} aria-hidden="true" />
            <span>沐智星球親子平台</span>
          </Link>
          <p>把資訊梳理好，陪孩子自在成長。</p>
          <span className="footer-mark">MUSE PLANET · GROW WITH WISDOM</span>
        </div>
      </footer>
    </div>
  );
}

function ContentEmpty({
  title,
  description,
  unavailable = false,
}: {
  title: string;
  description: string;
  unavailable?: boolean;
}) {
  return (
    <div
      className="content-empty"
      data-state={unavailable ? "unavailable" : "empty"}
      role={unavailable ? "alert" : "status"}
    >
      <span className="content-empty-icon" aria-hidden="true">
        <BookOpenText size={20} strokeWidth={1.6} />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}
