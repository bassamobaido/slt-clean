import PlatformPlaceholder from "./PlatformPlaceholder";

export default function YouTubeMonitoring() {
  return (
    <PlatformPlaceholder
      platformName="YouTube"
      platformNameAr="يوتيوب"
      color="#FF0000"
      platformKey="youtube"
      icon={
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      }
      accounts={[
        { name: "Thmanyah Exit", nameAr: "ثمانية اكزت", handle: "ThmanyahExit" },
        { name: "Radio Thmanyah", nameAr: "راديو ثمانية", handle: "RadioThmanyah" },
        { name: "Thmanyah", nameAr: "ثمانية", handle: "Thmanyah" },
        { name: "Thmanyah Sports", nameAr: "ثمانية رياضة", handle: "ThmanyahSports" },
      ]}
    />
  );
}
