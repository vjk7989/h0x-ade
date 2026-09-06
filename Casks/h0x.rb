cask "h0x" do
  arch arm: "arm64", intel: "x64"

  version "1.3.24"
  sha256 arm:   "fc707f290ff3b631b7b7947bf339885b61a43d2e89475997c125b61268ed4966",
         intel: "5f677c13a08f7a5740442e29d388285a86488c8c1f7aa5f10a8721a2c6ede8e4"

  url "https://github.com/vjk7989/h0x-ade/releases/download/v#{version}/h0x-macos-#{arch}.dmg",
      verified: "github.com/vjk7989/h0x-ade/"
  name "h0x-ADE"
  desc "IDE for orchestrating AI coding agents across terminals and worktrees"
  homepage "https://github.com/vjk7989/h0x-ade"

  livecheck do
    url :url
    strategy :github_latest
  end

  # Why: electron-updater (src/main/updater.ts) handles in-place updates by
  # writing a new h0x-ADE.app into /Applications. Marking the cask auto_updates
  # tells Homebrew not to compete with the in-app updater — `brew upgrade`
  # becomes a no-op unless the user passes --greedy, and brew's version
  # metadata stays aligned with whatever the app has swapped itself to.
  auto_updates true
  conflicts_with cask: "h0x@rc"
  depends_on macos: :big_sur

  app "h0x-ADE.app"

  # Why: expose the bundled `h0x` CLI on PATH at install time (Homebrew symlinks
  # this into its already-on-PATH bin dir). Without it, the CLI is only registered
  # by the in-app "Install CLI" action, which a headless host can never trigger —
  # so `h0x serve` on a server would be unreachable from the shell. The shim
  # resolves the real app by walking symlinks, so the Homebrew symlink works.
  binary "#{appdir}/h0x-ADE.app/Contents/Resources/bin/h0x"

  # Why: h0x-ADE writes user data under ~/.h0x (worktrees, agent state) and
  # Electron's standard userData directories. Zap removes everything the app
  # creates during normal use so `brew uninstall --zap` is a clean slate.
  zap trash: [
    "~/.h0x",
    "~/.orca",
    "~/Library/Application Support/h0x-ADE",
    "~/Library/Application Support/Orca",
    "~/Library/Caches/tech.pavii.h0xade",
    "~/Library/Caches/tech.pavii.h0xade.ShipIt",
    "~/Library/Caches/com.stablyai.orca",
    "~/Library/Caches/com.stablyai.orca.ShipIt",
    "~/Library/HTTPStorages/tech.pavii.h0xade",
    "~/Library/HTTPStorages/com.stablyai.orca",
    "~/Library/Preferences/tech.pavii.h0xade.plist",
    "~/Library/Preferences/com.stablyai.orca.plist",
    "~/Library/Saved Application State/tech.pavii.h0xade.savedState",
    "~/Library/Saved Application State/com.stablyai.orca.savedState",
  ]
end
