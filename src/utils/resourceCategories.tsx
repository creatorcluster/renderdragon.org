import {
  IconMusic,
  IconPhoto,
  IconVideo,
  IconFileText,
  IconFileMusic,
  IconBoxModel,
} from "@tabler/icons-react";

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case "music":
      return <IconMusic className="h-5 w-5" />;
    case "sfx":
      return <IconFileMusic className="h-5 w-5" />;
    case "images":
      return <IconPhoto className="h-5 w-5" />;
    case "animations":
      return <IconVideo className="h-5 w-5" />;
    case "fonts":
    case "presets":
      return <IconFileText className="h-5 w-5" />;
    case "minecraft-icons":
      return <IconBoxModel className="h-5 w-5" />;
    default:
      return <IconFileText className="h-5 w-5" />;
  }
};

export const getCategoryColor = (category: string) => {
  switch (category) {
    case "music":
      return "bg-blue-500/10 text-blue-500";
    case "sfx":
      return "bg-yellow-500/10 text-yellow-500";
    case "images":
      return "bg-purple-500/10 text-purple-500";
    case "animations":
      return "bg-red-500/10 text-red-500";
    case "fonts":
      return "bg-green-500/10 text-green-500";
    case "presets":
      return "bg-gray-500/10 text-gray-500";
    case "minecraft-icons":
      return "bg-green-500/10 text-green-600";
    default:
      return "bg-gray-500/10 text-gray-500";
  }
};
