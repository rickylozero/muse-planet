import Link from "next/link";
import { ArrowUpRight, Menu, Orbit } from "lucide-react";
import { WeatherWidget } from "@/components/weather-widget";

const navigation = [
  { href: "#today", label: "每日快訊" },
  { href: "#edb", label: "教育局資訊" },
  { href: "#topics", label: "主題探索" },
  { href: "#promise", label: "平台理念" },
  { href: "/admin/login", label: "內容管理" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="page-shell header-inner">
        <Link href="/" className="brand" aria-label="沐智星球親子平台首頁">
          <span className="brand-mark" aria-hidden="true">
            <Orbit size={27} strokeWidth={1.8} />
            <span className="brand-metal-star brand-metal-star--one" />
            <span className="brand-metal-star brand-metal-star--two" />
            <span className="brand-metal-star brand-metal-star--three" />
          </span>
          <span className="brand-copy">
            <span className="brand-name">沐智星球親子平台</span>
            <span className="brand-tagline">MUSE PLANET · WISDOM FOR FAMILIES</span>
          </span>
        </Link>

        <nav className="top-nav" aria-label="主要導覽">
          {navigation.map((item) => (
            <a className="nav-link" href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <a className="header-cta" href="#today">
          今日資訊
          <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden="true" />
        </a>
        <details className="mobile-nav">
          <summary aria-label="開啟或關閉網站選單">
            <Menu size={18} strokeWidth={2} aria-hidden="true" />
            <span>選單</span>
          </summary>
          <nav className="mobile-nav-panel" aria-label="行動版網站導覽">
            {navigation.map((item) => (
              <a className="mobile-nav-link" href={item.href} key={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
        </details>
      </div>
      <WeatherWidget />
    </header>
  );
}
