"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { MapPin } from "lucide-react";

// 城市预设：名称、经纬度、时区偏移（小时）
const CITIES = [
  { name: "北京", lat: 39.9, lon: 116.4, tz: 8 },
  { name: "上海", lat: 31.2, lon: 121.5, tz: 8 },
  { name: "福州", lat: 26.1, lon: 119.3, tz: 8 },
  { name: "东京", lat: 35.7, lon: 139.7, tz: 9 },
  { name: "纽约", lat: 40.7, lon: -74.0, tz: -4 },
  { name: "伦敦", lat: 51.5, lon: -0.1, tz: 1 },
  { name: "巴黎", lat: 48.9, lon: 2.3, tz: 2 },
  { name: "悉尼", lat: -33.9, lon: 151.2, tz: 10 },
  { name: "迪拜", lat: 25.2, lon: 55.3, tz: 4 },
];

type City = (typeof CITIES)[0];

export default function HeroClock({ name }: { name?: string }) {
  const [time, setTime] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [temp, setTemp] = useState<number | null>(null);
  const [city, setCity] = useState<City>(CITIES[0]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [showPicker, setShowPicker] = useState(false);

  // 加载已选城市
  useEffect(() => {
    const saved = localStorage.getItem("clock-city");
    if (saved) {
      const found = CITIES.find((c) => c.name === saved);
      if (found) setCity(found);
    }
  }, []);

  // 获取天气
  const fetchWeather = useCallback(async (c: City) => {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current_weather=true`
      );
      const data = await res.json();
      if (data.current_weather?.temperature != null) {
        setTemp(Math.round(data.current_weather.temperature));
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchWeather(city);
  }, [city, fetchWeather]);

  // 更新时间
  useEffect(() => {
    const update = () => {
      const now = new Date();
      // 转为目标城市时间
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const cityTime = new Date(utc + city.tz * 3600000);

      const hours = cityTime.getHours();
      const mins = cityTime.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const h12 = hours % 12 || 12;
      setTime(`${h12}:${mins} ${ampm}`);

      const days = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      setDateStr(
        `${cityTime.getFullYear()}年${cityTime.getMonth() + 1}月${cityTime.getDate()}日 ${days[cityTime.getDay()]}`
      );
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [city.tz]);

  const selectCity = (c: City) => {
    setCity(c);
    localStorage.setItem("clock-city", c.name);
    setShowPicker(false);
  };

  return (
    <div className="flex flex-col items-center select-none">
      {/* 日期 */}
      <p className="text-white/60 text-sm tracking-[3px] mb-4 font-light">
        {dateStr}
      </p>

      {/* 时间 + 温度 */}
      <button
        onClick={() => setShowPicker(true)}
        className="group flex items-baseline gap-5 cursor-pointer"
      >
        <h1
          className="text-white font-thin tracking-[2px] leading-none group-hover:text-white/80 transition-colors"
          style={{
            fontSize: "clamp(80px, 14vw, 170px)",
            fontWeight: 200,
            letterSpacing: "3px",
          }}
        >
          {time || "--:--"}
        </h1>
        <span className="text-white/20 text-[clamp(24px,4vw,48px)] font-thin">·</span>
        <span
          className="text-white font-thin tracking-[2px] leading-none group-hover:text-white/80 transition-colors"
          style={{
            fontSize: "clamp(80px, 14vw, 170px)",
            fontWeight: 200,
          }}
        >
          {temp != null ? `${temp}°` : "--°"}
        </span>
      </button>

      {/* 城市名 */}
      <button
        onClick={() => setShowPicker(true)}
        className="mt-6 flex items-center gap-1.5 text-white/40 text-sm tracking-[4px] font-light hover:text-white/70 transition-colors"
      >
        <MapPin className="h-3.5 w-3.5" />
        {city.name}
      </button>

      {/* 名字 */}
      {name && (
        <p className="mt-6 text-white/30 text-sm tracking-[6px] font-light uppercase">
          {name}
        </p>
      )}

      {/* 城市选择弹窗 — Portal 到 body */}
      {showPicker && mounted && createPortal(
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowPicker(false)}
        >
          <div
            className="w-72 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white/80 text-sm font-medium mb-4 text-center tracking-[2px]">
              选择城市
            </h3>
            <div className="space-y-1">
              {CITIES.map((c) => (
                <button
                  key={c.name}
                  onClick={() => selectCity(c)}
                  className={`w-full text-left rounded-lg px-4 py-3 text-sm transition-all ${
                    c.name === city.name
                      ? "bg-white/15 text-white"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
