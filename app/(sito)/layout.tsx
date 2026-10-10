import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

// .site scopes the bolder public type (weights, section titles, eyebrows) away from the workspace.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site">
      <a href="#contenuto" className="skip-link">
        Vai al contenuto
      </a>
      <SiteHeader />
      <main id="contenuto">{children}</main>
      <SiteFooter />
    </div>
  );
}
