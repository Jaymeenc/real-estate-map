// Paste this entire file in your MapWithFilters.js
// Make sure Tailwind is enabled in your project

import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useLoadScript,
  MarkerClusterer,
} from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const center = { lat: 23.0225, lng: 72.5714 };

function MapWithFilters() {
  const [data, setData] = useState([]);
  const [groupedData, setGroupedData] = useState([]);
  const [filters, setFilters] = useState({});
  const [selected, setSelected] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);

  const csvUrl = process.env.REACT_APP_CSV_URL;

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  useEffect(() => {
    if (!csvUrl) return;

    Papa.parse(csvUrl, {
      download: true,
      header: true,
      complete: (results) => {
        const parsed = results.data.filter((d) => d["Latitude"] && d["Longitude"]);
        const filledData = fillMergedCells(parsed);
        setData(filledData);

        const allFilters = {};
        filledData.forEach((item) => {
          Object.entries(item).forEach(([key, value]) => {
            if (["Latitude", "Longitude", "Price (₹)"].includes(key)) return;
            if (!allFilters[key]) allFilters[key] = new Set();
            if (value && value.trim()) allFilters[key].add(value.trim());
          });
        });

        const filtersObj = {};
        Object.entries(allFilters).forEach(([key, valSet]) => {
          filtersObj[key] = {
            options: Array.from(valSet),
            selected: [],
          };
        });

        setFilters(filtersObj);

        const prices = filledData.map((d) => parseFloat(d["Price (₹)"])).filter(Boolean);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        setPriceRange([min, max]);

        groupPins(filledData, filtersObj, [min, max]);
      },
    });
  }, [csvUrl]);

  const fillMergedCells = (rows) => {
    const filledRows = [...rows];
    const lastValues = {};
    for (let i = 0; i < filledRows.length; i++) {
      const row = filledRows[i];
      for (const key in row) {
        if (row[key] && row[key].trim()) {
          lastValues[key] = row[key].trim();
        } else {
			row[key] = (lastValues[key] || "").trim();
        }
      }
    }
    return filledRows;
  };

  const groupPins = (rawData, filters, range) => {
    let filtered = [...rawData];

    Object.keys(filters).forEach((key) => {
      const selected = filters[key].selected;
      if (selected.length > 0) {
        filtered = filtered.filter((item) => selected.includes(item[key]));
      }
    });

    filtered = filtered.filter((item) => {
      const price = parseFloat(item["Price (₹)"]);
      return !isNaN(price) && price >= range[0] && price <= range[1];
    });

    const groups = {};
    filtered.forEach((item) => {
      const key = `${item.Latitude}_${item.Longitude}`;
      if (!groups[key]) groups[key] = { lat: parseFloat(item.Latitude), lng: parseFloat(item.Longitude), items: [] };
      groups[key].items.push(item);
    });

    setGroupedData(Object.values(groups));
  };

  const applyFilters = () => {
    groupPins(data, filters, priceRange);
    setShowFilters(false);
    setSelected(null);
  };

  const toggleOption = (key, option) => {
    setFilters((prev) => {
      const selected = prev[key].selected.includes(option)
        ? prev[key].selected.filter((val) => val !== option)
        : [...prev[key].selected, option];

      return {
        ...prev,
        [key]: { ...prev[key], selected },
      };
    });
  };

  const selectAll = (key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: { ...prev[key], selected: [...prev[key].options] },
    }));
  };

  const clearAll = (key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: { ...prev[key], selected: [] },
    }));
  };

  const handlePriceChange = (e, idx) => {
    const newRange = [...priceRange];
    newRange[idx] = parseFloat(e.target.value);
    setPriceRange(newRange);
  };

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <div className="flex flex-col relative" style={{ height: "100dvh" }}>
      <div className="flex-1">
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={12}>
          <MarkerClusterer>
            {(clusterer) =>
              groupedData.map((group, idx) => (
                <Marker
                  key={idx}
                  clusterer={clusterer}
                  position={{ lat: group.lat, lng: group.lng }}
                  onClick={() => setSelected(group)}
                />
              ))
            }
          </MarkerClusterer>

          {selected && (
            <InfoWindow
              position={{ lat: selected.lat, lng: selected.lng }}
              onCloseClick={() => setSelected(null)}
            >
              <div className="text-sm max-w-[250px]">
                {selected.items.map((item, i) => (
                  <div key={i} className="mb-2 border-b pb-1">
                    {Object.entries(item)
                      .filter(([key]) => key !== "Latitude" && key !== "Longitude")
                      .map(([key, value], idx) => (
                        <p key={idx}>
                          <strong>{key}:</strong> {value}
                        </p>
                      ))}
                  </div>
                ))}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {/* Filters Bottom Drawer */}
      {showFilters && (
        <div className="absolute bottom-0 left-0 right-0 h-[80vh] bg-white z-30 shadow-xl flex flex-col overflow-hidden border-t rounded-t-xl">
          <div className="overflow-y-auto p-4">
            <h2 className="text-lg font-bold mb-4">Filters</h2>

            {Object.keys(filters).map((key) => (
              <div key={key} className="mb-5">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold">{key}</label>
                  <div className="space-x-2 text-xs text-blue-600">
                    <button onClick={() => selectAll(key)}>Select All</button>
                    <button onClick={() => clearAll(key)}>Clear</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters[key].options.map((option, i) => {
                    const selected = filters[key].selected.includes(option);
                    return (
                      <button
                        key={i}
                        onClick={() => toggleOption(key, option)}
                        className={`px-3 py-1 rounded-full border text-sm ${
                          selected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-800 border-gray-300"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Price Range */}
            <div className="mb-4">
              <label className="block text-sm font-semibold">Price Range (₹)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={priceRange[0]}
                  min="0"
                  className="w-1/2 p-2 rounded border"
                  onChange={(e) => handlePriceChange(e, 0)}
                />
                <span>to</span>
                <input
                  type="number"
                  value={priceRange[1]}
                  min="0"
                  className="w-1/2 p-2 rounded border"
                  onChange={(e) => handlePriceChange(e, 1)}
                />
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <div className="p-4 border-t bg-white">
            <button
              onClick={applyFilters}
              className="bg-blue-600 text-white w-full py-3 rounded text-lg font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Show Filters Button */}
      {!showFilters && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-white shadow-inner z-30"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
        >
          <div className="p-3">
            <button
              className="bg-blue-600 text-white w-full py-3 rounded text-lg font-medium"
              onClick={() => {
                setShowFilters(true);
                setSelected(null);
              }}
            >
              Show Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapWithFilters;
