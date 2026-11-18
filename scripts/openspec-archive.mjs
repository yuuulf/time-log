// PR に `archive` ラベルが付いたときに、PR が含む OpenSpec change をアーカイブする。
// .github/workflows/openspec-archive.yml から実行する。

const CHANGES_DIR = "openspec/changes/";

/**
 * PR の差分に含まれるパスから、アーカイブ対象の change 名を求める。
 * `archive/` 配下と、作業ツリーに存在しない（アーカイブ済みの）change は対象にしない。
 *
 * @param {string[]} diffPaths `git diff --name-only` の結果
 * @param {(name: string) => boolean} changeExists `openspec/changes/<name>/` が存在するか
 * @returns {string[]} 名前順に並べた change 名
 */
export function findArchiveTargets(diffPaths, changeExists) {
  const names = new Set();
  for (const path of diffPaths) {
    if (!path.startsWith(CHANGES_DIR)) continue;
    const [name, ...rest] = path.slice(CHANGES_DIR.length).split("/");
    if (!name || rest.length === 0 || name === "archive") continue;
    names.add(name);
  }
  return [...names].filter((name) => changeExists(name)).sort();
}

/**
 * `openspec list --json` の結果から、未完了タスクのある change を求める。
 * 完了の判定は OpenSpec CLI の集計（completedTasks / totalTasks）に従う。
 *
 * @param {{ changes: { name: string, completedTasks: number, totalTasks: number }[] }} list
 * @param {string[]} targets アーカイブ対象の change 名
 * @returns {{ name: string, remaining: number }[]}
 */
export function findIncompleteChanges(list, targets) {
  return targets.flatMap((name) => {
    const change = list.changes.find((c) => c.name === name);
    if (!change) {
      throw new Error(`change「${name}」のタスクの状況を取得できませんでした`);
    }
    const remaining = change.totalTasks - change.completedTasks;
    return remaining > 0 ? [{ name, remaining }] : [];
  });
}
