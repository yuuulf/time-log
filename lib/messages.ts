/**
 * 画面に表示する文言。コンポーネントに直接書かず、ここから参照する。
 * 文言のルールは AGENTS.md の「UI と文言の統一」を参照。
 */
export const messages = {
  app: {
    name: "TimeLog",
    description:
      "作業にかかった時間を記録して、あとから振り返るためのアプリです。",
  },
  nav: {
    label: "メインメニュー",
    home: "ホーム",
    menu: "メニュー",
    close: "閉じる",
    noRunning: "記録中のタスクはありません。",
  },
  timeEntries: {
    taskName: "タスク名",
    taskNamePlaceholder: "タスク名（省略できます）",
    project: "プロジェクト",
    noProject: "プロジェクトなし",
    /** 一覧のプロジェクトのボタンの読み上げ名 */
    projectButton: (name: string) => `プロジェクト：${name}`,
    /** 一覧の時刻のボタンの読み上げ名（例: 「開始時刻 14:58:46」） */
    timeButton: (label: string, time: string) => `${label} ${time}`,
    startedAt: "開始時刻",
    endedAt: "終了時刻",
    duration: "作業時間",
    /** 日付の見出しの右端の、その日の合計時間の前に付ける読み上げ用の文言 */
    dayTotal: "合計",
    running: "記録中",
    untitled: "（タスク名なし）",
    runningHeading: "記録中のタスク",
    /** トップページの記録の一覧の見出し（今日に開始した記録だけを出す） */
    listHeading: "今日の記録",
    empty: "今日の記録はまだありません。",
    loading: "記録を読み込んでいます…",
    confirmDelete: "この記録を削除しますか？",
    /** 「今日の記録」の表示の切り替え */
    view: {
      label: "表示",
      list: "一覧",
      timeline: "カレンダー",
    },
    timeline: {
      /** タイムラインの領域の読み上げ名 */
      label: "タイムライン",
      /** 入力欄（追加・修正）の読み上げ名 */
      editorLabel: "記録の入力",
      create: "追加",
      close: "閉じる",
      /** 帯の時刻（例: 「09:15〜10:30」） */
      range: (start: string, end: string) => `${start}〜${end}`,
      /** 帯の読み上げ名（例: 「資料作成 09:15〜10:30」） */
      entryLabel: (taskName: string, range: string) => `${taskName} ${range}`,
    },
    actions: {
      start: "開始",
      stop: "終了",
      resume: "再開",
      more: "その他の操作",
      delete: "削除",
    },
    errors: {
      taskNameTooLong: "タスク名は200文字以内で入力してください。",
      timeRequired: "日時を入力してください。",
      timeInvalid: "日時の形式が正しくありません。",
      timeInFuture: "未来の時刻は入力できません。",
      endBeforeStart: "終了時刻は開始時刻より後にしてください。",
      endWhileRunning: "記録中の記録は終了ボタンで終了してください。",
      notFound: "記録が見つかりません。ページを読み込み直してください。",
    },
  },
  projects: {
    title: "プロジェクト",
    formHeading: "プロジェクトの作成",
    listHeading: "プロジェクトの一覧",
    name: "プロジェクト名",
    color: "色",
    clientName: "クライアント名",
    clientNamePlaceholder: "クライアント名（省略できます）",
    description: "説明",
    descriptionPlaceholder: "説明（省略できます）",
    colors: {
      red: "赤",
      orange: "橙",
      amber: "黄",
      green: "緑",
      teal: "青緑",
      sky: "水色",
      blue: "青",
      violet: "紫",
      pink: "ピンク",
      brown: "茶",
    },
    empty: "まだプロジェクトがありません。「新規作成」から作成できます。",
    loading: "プロジェクトを読み込んでいます…",
    confirmDelete: "このプロジェクトを削除しますか？",
    actions: {
      add: "新規作成",
      createSubmit: "作成",
      more: "その他の操作",
      archive: "アーカイブ",
      unarchive: "アーカイブ解除",
      archived: "アーカイブ済み",
      delete: "削除",
    },
    archived: {
      title: "アーカイブ済みのプロジェクト",
      empty: "アーカイブしたプロジェクトはありません。",
      loading: "アーカイブ済みのプロジェクトを読み込んでいます…",
      notice: "アーカイブ済みのプロジェクトです。",
    },
    detail: {
      backToList: "プロジェクトの一覧",
      loading: "プロジェクトを読み込んでいます…",
      notFound: "プロジェクトが見つかりません。削除された可能性があります。",
    },
    errors: {
      nameRequired: "プロジェクト名を入力してください。",
      nameTooLong: "プロジェクト名は100文字以内で入力してください。",
      nameTaken: "同じ名前のプロジェクトがあります。",
      clientNameTooLong: "クライアント名は100文字以内で入力してください。",
      descriptionTooLong: "説明は1000文字以内で入力してください。",
      colorRequired: "色を選んでください。",
      inUse: "記録が紐づいているため、このプロジェクトは削除できません。",
      notFound:
        "プロジェクトが見つかりません。ページを読み込み直してください。",
    },
  },
  history: {
    title: "過去の記録",
    monthNav: "表示する月",
    prevMonth: "前の月",
    nextMonth: "次の月",
    monthView: "月ごとの表示",
    weekNav: "表示する週",
    prevWeek: "前の週",
    nextWeek: "次の週",
    rangeHeading: "期間の指定",
    from: "開始日",
    to: "終了日",
    rangeSeparator: "〜",
    show: "表示",
    empty: "この期間の記録はありません。",
    csv: {
      /** 「CSV 出力」ボタンの名前 */
      export: "CSV 出力",
      /** CSV の 1 行目の列名 */
      columns: [
        "日付",
        "開始時刻",
        "終了時刻",
        "作業時間（分）",
        "タスク名",
        "プロジェクト",
      ],
      /** ダウンロードするファイルの名前（例: 「記録 2026年11月.csv」） */
      filename: (heading: string) => `記録 ${heading}.csv`,
    },
    errors: {
      dateRequired: "開始日と終了日を入力してください。",
      endBeforeStart: "終了日は開始日以降にしてください。",
      rangeTooLong: "期間は366日以内にしてください。",
    },
  },
  summary: {
    title: "集計",
    total: "合計時間",
    workDays: "稼働日数",
    roundingNote: "作業時間は記録ごとに秒を切り捨てて集計しています。",
    /** 稼働日数の表示（例: 「12日」） */
    days: (count: number) => `${count}日`,
    weekly: "週ごとの集計",
    week: "週",
    /** 週の範囲（例: 「11月16日〜11月22日」） */
    weekRange: (first: string, last: string) => `${first}〜${last}`,
    byProject: "プロジェクトごとの集計",
    project: "プロジェクト",
    noEntries: "この期間に集計する記録はありません。",
    pdf: "PDF 出力",
    /** 印刷ダイアログで PDF に保存するときの既定のファイル名（例: 「集計 2026年11月」） */
    pdfTitle: (heading: string) => `集計 ${heading}`,
  },
} as const;
