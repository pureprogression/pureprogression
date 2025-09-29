"use client"; // если ты на Next 13+ в папке app

export default function ExercisesSection() {
  const data = [
    {
      group: "Кор",
      exercises: [
        { name: "Планка", video: "/videos/x93.mp4", desc: "3 подхода по 40 сек" },
        { name: "Скручивания", video: "/videos/x92.mp4", desc: "3 подхода по 15" },
        { name: "Скручивания", video: "/videos/x51.mp4", desc: "3 подхода по 15" },
      ],
    },
    {
      group: "Ноги",
      exercises: [
        { name: "Приседания", video: "/videos/squat.mp4", desc: "4 подхода по 12" },
        { name: "Выпады", video: "/videos/lunge.mp4", desc: "3 подхода по 10" },
      ],
    },
  ];

  return (
    <section className="px-4 py-8 bg-gray-">
      <h2 className="text-2xl font-bold mb-6">Упражнения</h2>

      {data.map((group) => (
        <div key={group.group} className="mb-8">
          <h3 className="text-xl font-semibold mb-4">{group.group}</h3>

          <div className="space-y-6">
            {group.exercises.map((ex) => (
              <div
                key={ex.name}
                 className="relative w-full sm:max-w-[360px] lg:max-w-[420px] mx-auto aspect-[9/16] overflow-hidden"
              >
                {/* блок видео */}
                <video
                  src={ex.video}
                  controls
                  playsInline
                  className="absolute inset-0 w-full h-full rounded-lg"
                />

                <h4 className="mt-3 text-lg font-semibold">{ex.name}</h4>
                <p className="text-gray-600 text-sm">{ex.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
