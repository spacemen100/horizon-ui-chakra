import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MdPlace } from "react-icons/md";
import { renderToString } from "react-dom/server";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://hvjzemvfstwwhhahecwu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anplbXZmc3R3d2hoYWhlY3d1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5MTQ4Mjc3MCwiZXhwIjoyMDA3MDU4NzcwfQ.6jThCX2eaUjl2qt4WE3ykPbrh6skE8drYcmk-UCNDSw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const createCustomIcon = (user) => {
  const placeIconHtml = renderToString(<MdPlace style={{ fontSize: '24px', color: 'red' }} />);
  const userPhotoHtml = user.photo_profile_url 
    ? `<img src="${user.photo_profile_url}" alt="User" style="width: 24px; height: 24px; border-radius: 50%; margin-left: 5px;"/>`
    : '';
  const iconHtml = `<div style="display: flex; align-items: center;">${placeIconHtml}${userPhotoHtml}</div>`;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-leaflet-icon',
    iconSize: L.point(50, 50),
    iconAnchor: [25, 50],
    popupAnchor: [0, -50]
  });
};

const MapComponent = () => {
  const mapRef = useRef(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Fetch users from the database
    const fetchUsers = async () => {
      let { data: usersOnGround, error } = await supabase
        .from('vianney_users_on_the_ground')
        .select('*');

      if (error) {
        console.error('Error fetching users:', error);
      } else {
        setUsers(usersOnGround);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map').setView([0, 0], 13); // Initial map setup
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }

    if (users.length > 0) {
      mapRef.current.setView([users[0].latitude, users[0].longitude], 13);

      users.forEach(user => {
        if (user) { // Check if user is defined
          // Create the HTML content for the popup
          const popupContent = `
            <div>
              <strong>${user.first_name} ${user.family_name}</strong>
              ${user.photo_profile_url ? `<br/><img src="${user.photo_profile_url}" alt="${user.first_name}" style="width: 100px; height: auto; border-radius: 50%; margin-top: 5px;"/>` : ''}
            </div>
          `;

          const customIcon = createCustomIcon(user); // Moved inside forEach

          L.marker([user.latitude, user.longitude], { icon: customIcon })
            .addTo(mapRef.current)
            .bindPopup(popupContent); // Bind the custom popup content
        }
      });
    }
  }, [users]);



  return <div id="map" style={{ height: '500px', width: '100%' }}></div>;
};

export default MapComponent;
