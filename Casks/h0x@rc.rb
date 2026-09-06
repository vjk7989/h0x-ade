cask "h0x@rc" do
  arch arm: "arm64", intel: "x64"

  version "1.4.36-rc.3"
  sha256 arm:   "563b6b14323fc9d5489299c82442d514bc12cabffc9d06d3964ed572af4b3955",
         intel: "457088c7021f07de1a419197f7b2bd00092741ad4727d4fef3d86af38a6831e7"

  url "https://github.com/vjk7989/h0x-ade/releases/download/v#{version}/h0x-macos-#{arch}.dmg",
      verified: "github.com/vjk7989/h0x-ade/"
  name "h0x-ADE RC"
  desc "IDE for orchestrating AI coding agents across terminals and worktrees"
  homepage "https://github.com/vjk7989/h0x-ade"

  livecheck do
    url "https://github.com/vjk7989/h0x-ade"
    regex(/^v?(\d+(?:\.\d+)+-rc\.\d+)$/i)
    strategy :github_releases do |json, regex|
      json.map do |release|
        next if release["draft"]
        next unless release["prerelease"]

        match = release["tag_name"]&.match(regex)
        next if match.blank?

        match[1]
      end
    end
  end

  # Why: RC installs should follow h0x-ADE's prerelease-aware updater instead of
  # waiting for Homebrew metadata churn between frequent release candidates.
  auto_updates true
  conflicts_with cask: "h0x"
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
