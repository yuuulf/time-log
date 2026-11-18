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
  },
  timeEntries: {
    taskName: "タスク名",
    taskNamePlaceholder: "タスク名（省略できます）",
    startedAt: "開始時刻",
    endedAt: "終了時刻",
    duration: "作業時間",
    running: "記録中",
    untitled: "（タスク名なし）",
    runningHeading: "記録中のタスク",
    listHeading: "記録",
    empty:
      "まだ記録がありません。タスク名を入力して開始ボタンを押すと記録が始まります。",
    loading: "記録を読み込んでいます…",
    confirmDelete: "この記録を削除しますか？",
    actions: {
      start: "開始",
      stop: "終了",
      resume: "再開",
      edit: "修正",
      save: "保存",
      cancel: "キャンセル",
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
} as const;
