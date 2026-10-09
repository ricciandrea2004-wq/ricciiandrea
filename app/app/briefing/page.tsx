import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import Tag from "@/components/Tag";
import PageHead from "@/components/workspace/PageHead";
import Topbar from "@/components/workspace/Topbar";
import { briefings, organization } from "@/lib/demo-data";
import { briefingStatusLabel, formatShortDate } from "@/lib/domain";

export const metadata: Metadata = { title: "Briefing" };

export default function BriefingsPage() {
  const rows = [...briefings].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <Topbar crumbs={[{ label: organization.name, href: "/app" }, { label: "Briefing" }]} />
      <div className="ws-content">
        <PageHead
          icon="doc"
          title="Briefing"
          description="I documenti preparati per il team, con i segnali verificati del periodo."
          actions={
            <Link href="/app/briefing/nuovo" className="btn btn-primary">
              <Icon name="plus" />
              Nuovo briefing
            </Link>
          }
        />
        <div className="table-wrap ds-page">
          <table className="db-table">
            <thead>
              <tr>
                <th scope="col">Titolo</th>
                <th scope="col">Periodo</th>
                <th scope="col">Segnali</th>
                <th scope="col">Stato</th>
                <th scope="col">Data</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td className="title-cell">
                    <Link href={`/app/briefing/${b.id}`}>{b.title}</Link>
                  </td>
                  <td className="nowrap muted">{b.period}</td>
                  <td className="num">{b.signalIds.length}</td>
                  <td>
                    <Tag color={b.status === "sent" ? "green" : "gray"}>{briefingStatusLabel[b.status]}</Tag>
                  </td>
                  <td className="nowrap num">{formatShortDate(b.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
