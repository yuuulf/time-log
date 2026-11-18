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
