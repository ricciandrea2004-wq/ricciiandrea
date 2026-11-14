"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

const KEY = "vista-bari-onboarding-v1";

export function OnboardingTips() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      /* ignore */
    }
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
  }

  if (!open) return null;

  return (
    <div className="onboarding" role="dialog" aria-labelledby="onboarding-title">
      <div className="onboarding__card">
        <p className="section__eyebrow">Vista Bari</p>
        <h2 id="onboarding-title">{t("onboarding_title")}</h2>
        <p className="muted">{t("onboarding_body")}</p>
        <button type="button" className="btn btn--primary" onClick={dismiss}>
          {t("onboarding_dismiss")}
        </button>
      </div>
    </div>
  );
}
