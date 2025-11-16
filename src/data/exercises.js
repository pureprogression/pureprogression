const ASSETS_BASE_URL = process.env.NEXT_PUBLIC_ASSETS_BASE_URL || "https://pub-24028780ba564e299106a5335d66f54c.r2.dev";

export const exercises = [
    {
        id: "1",
        title: "Australian Pull-ups",
        video: `${ASSETS_BASE_URL}/videos/x92.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x92.jpg`,
        muscleGroups: ["back", "arms"]
    },
    {
        id: "2",
        title: "Band Muscle-Ups",
        video: `${ASSETS_BASE_URL}/videos/x93.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x93.jpg`,
        muscleGroups: ["back", "arms"]
    },
    {
        id: "3",
        title: "L Pull-ups",
        video: `${ASSETS_BASE_URL}/videos/x51web.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x51web.jpg`,
        muscleGroups: ["back", "abs", "arms", "core"]
    },
    {
        id: "4",
        title: "Core Pull-ups",
        video: `${ASSETS_BASE_URL}/videos/x72.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x72.jpg`,
        muscleGroups: ["abs"]
    },
    {
        id: "5",
        title: "Squats",
        video: `${ASSETS_BASE_URL}/videos/x102.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x102.jpg`,
        muscleGroups: ["legs", "glutes"]
    },
    {
        id: "6",
        title: "Handstand",
        video: `${ASSETS_BASE_URL}/videos/x113.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x113.jpg`,
        muscleGroups: ["shoulders", "arms", "core", "abs"]
    },
    {
        id: "7",
        title: "Push-ups",
        video: `${ASSETS_BASE_URL}/videos/x84.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x84.jpg`,
        muscleGroups: ["chest", "shoulders", "arms"]
    },
    {
        id: "8",
        title: "Decline Push-ups",
        video: `${ASSETS_BASE_URL}/videos/x124.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x124.jpg`,
        muscleGroups: ["chest", "shoulders"]
    },
    {
        id: "9",
        title: "Push-ups",
        video: `${ASSETS_BASE_URL}/videos/x32.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x32.jpg`,
        muscleGroups: ["chest", "shoulders", "arms"]
    }
]
