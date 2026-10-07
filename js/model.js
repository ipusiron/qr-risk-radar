// 生成物（tools/calibrate.mjs が学習用のデータから作る。手で編集しない）
// 兆候ごとの点数・TLD の点数・低中高の境目と、学習に使っていないデータでの判定の割合（README の表と同じ値）
globalThis.QRModel = {
  "version": "2026-10-07",
  "points": {
    "http": 1,
    "ip-host": 3,
    "userinfo": 4,
    "port": 1,
    "hosting": 2,
    "shortener": 1,
    "idn-mixed": 4,
    "brand-in-domain": 1,
    "lookalike": 3,
    "fake-official": 4,
    "bait-domain": 3,
    "brand-in-subdomain": 1,
    "brand-in-path": 1,
    "bait-subdomain": 2,
    "bait-path": 1,
    "hyphens": 2,
    "digits-mixed": 2,
    "random-label": 2,
    "download": 1,
    "embedded-url": 1,
    "double-encoding": 1,
    "long": 1
  },
  "tldPoints": {
    "top": 2,
    "cn": 2,
    "cfd": 2,
    "info": 2,
    "dev": 2,
    "cc": 2,
    "app": 2
  },
  "medium": 3,
  "high": 4,
  "training": {
    "phishing": 3221,
    "benign": 525
  },
  "evaluation": [
    {
      "id": "jpcert",
      "source": "JPCERT/CC phishurl-list 2026-05",
      "n": 1743,
      "medium": 40.4,
      "high": 32.6
    },
    {
      "id": "openphish",
      "source": "OpenPhish public feed 2026-10-07 (odd half)",
      "n": 150,
      "medium": 54.7,
      "high": 50
    },
    {
      "id": "crux",
      "source": "CrUX Japan top 1000, 2026-08 (odd half)",
      "n": 500,
      "medium": 0,
      "high": 0
    },
    {
      "id": "crux5k",
      "source": "CrUX Japan rank 1001-5000, 2026-08",
      "n": 4000,
      "medium": 1,
      "high": 0.4
    },
    {
      "id": "legit",
      "source": "Official login pages (25)",
      "n": 25,
      "medium": 0,
      "high": 0
    }
  ]
};
