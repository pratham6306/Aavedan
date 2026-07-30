# knowledge/data/complaint_data.py

COMPLAINT_DATA = [

    {
        "name": "Pothole",
        "slug": "pothole",
        "category": "Road & Infrastructure",
        "department": "Public Works Department (PWD)",
        "priority": "MEDIUM",
        "estimated_resolution_days": 7,
        "description": "Road surface damaged with potholes affecting traffic and safety.",
        "keywords": [
            "pothole",
            "road hole",
            "pit",
            "crater",
            "damaged road",
            "broken road",
            "road damage"
        ],
        "required_fields": [
            {
                "field_name": "address",
                "display_name": "Address",
                "is_required": True,
            },
            {"field_name": "district", "display_name": "District", "is_required": True},
            {"field_name": "landmark", "display_name": "Nearby Landmark", "is_required": False},
            {"field_name": "image", "display_name": "Photo", "is_required": False},
        ]
    },

    {
        "name": "Broken Road",
        "slug": "broken-road",
        "category": "Road & Infrastructure",
        "department": "Public Works Department (PWD)",
        "priority": "HIGH",
        "estimated_resolution_days": 10,
        "description": "Road is severely damaged or unusable.",
        "keywords": [
            "broken road",
            "road damaged",
            "road cracked",
            "road collapsed",
            "bad road",
            "damaged street"
        ],
        "required_fields": [
            {"field_name": "address", "display_name": "Address", "is_required": True},
            {"field_name": "district", "display_name": "District", "is_required": True},
            {"field_name": "image", "display_name": "Photo", "is_required": False},
        ]
    },

    {
        "name": "Open Manhole",
        "slug": "open-manhole",
        "category": "Road & Infrastructure",
        "department": "Municipal Corporation",
        "priority": "HIGH",
        "estimated_resolution_days": 2,
        "description": "Open or uncovered manhole posing public safety risk.",
        "keywords": [
            "open manhole",
            "manhole open",
            "missing cover",
            "broken manhole",
            "drain cover missing"
        ],
        "required_fields": [
            {"field_name": "address", "display_name": "Address", "is_required": True},
            {"field_name": "district", "display_name": "District", "is_required": True},
            {"field_name": "image", "display_name": "Photo", "is_required": True},
        ]
    },

    {
        "name": "Road Blockage",
        "slug": "road-blockage",
        "category": "Road & Infrastructure",
        "department": "Municipal Corporation",
        "priority": "HIGH",
        "estimated_resolution_days": 2,
        "description": "Road blocked due to debris, construction, or other obstacles.",
        "keywords": [
            "road blocked",
            "road blockage",
            "obstruction",
            "blocked street",
            "debris on road",
            "road closed"
        ],
        "required_fields": [
            {"field_name": "address", "display_name": "Address", "is_required": True},
            {"field_name": "district", "display_name": "District", "is_required": True},
            {"field_name": "image", "display_name": "Photo", "is_required": False},
        ]
    },

    {
        "name": "Water Leakage",
        "slug": "water-leakage",
        "category": "Water Supply",
        "department": "Water Supply Department",
        "priority": "HIGH",
        "estimated_resolution_days": 2,
        "description": "Leakage from public water pipelines.",
        "keywords": [
            "water leakage",
            "pipe leakage",
            "water pipe burst",
            "water flowing",
            "pipeline leak",
            "water wastage"
        ],
        "required_fields": [
            {"field_name": "address", "display_name": "Address", "is_required": True},
            {"field_name": "district", "display_name": "District", "is_required": True},
            {"field_name": "image", "display_name": "Photo", "is_required": False},
        ]
    },

    {
        "name": "No Water Supply",
        "slug": "no-water-supply",
        "category": "Water Supply",
        "department": "Water Supply Department",
        "priority": "HIGH",
        "estimated_resolution_days": 1,
        "description": "Water supply unavailable in the affected area.",
        "keywords": [
            "no water",
            "water not coming",
            "dry tap",
            "water supply off",
            "water unavailable"
        ],
        "required_fields": [
            {"field_name": "address", "display_name": "Address", "is_required": True},
            {"field_name": "district", "display_name": "District", "is_required": True},
        ]
    },

    {
        "name": "Low Water Pressure",
        "slug": "low-water-pressure",
        "category": "Water Supply",
        "department": "Water Supply Department",
        "priority": "MEDIUM",
        "estimated_resolution_days": 3,
        "description": "Water pressure is insufficient for normal usage.",
        "keywords": [
            "low pressure",
            "slow water",
            "weak water flow",
            "less water pressure"
        ],
        "required_fields": [
            {"field_name": "address", "display_name": "Address", "is_required": True},
            {"field_name": "district", "display_name": "District", "is_required": True},
        ]
    },

    {
        "name": "Street Light Not Working",
        "slug": "street-light-not-working",
        "category": "Electricity",
        "department": "Electricity Distribution Department",
        "priority": "MEDIUM",
        "estimated_resolution_days": 3,
        "description": "Street light is not functioning.",
        "keywords": [
            "street light",
            "light not working",
            "pole light",
            "street lamp",
            "dark road"
        ],
        "required_fields": [
            {"field_name": "address", "display_name": "Address", "is_required": True},
            {"field_name": "district", "display_name": "District", "is_required": True},
            {"field_name": "pole_number", "display_name": "Pole Number", "is_required": False},
        ]
    },

    {
        "name": "Power Failure",
        "slug": "power-failure",
        "category": "Electricity",
        "department": "Electricity Distribution Department",
        "priority": "HIGH",
        "estimated_resolution_days": 1,
        "description": "Electricity outage affecting homes or public areas.",
        "keywords": [
            "power cut",
            "no electricity",
            "power failure",
            "blackout",
            "electricity gone"
        ],
        "required_fields": [
            {"field_name": "address", "display_name": "Address", "is_required": True},
            {"field_name": "district", "display_name": "District", "is_required": True},
        ]
    },

    {
        "name": "Transformer Fault",
        "slug": "transformer-fault",
        "category": "Electricity",
        "department": "Electricity Distribution Department",
        "priority": "HIGH",
        "estimated_resolution_days": 2,
        "description": "Fault or damage in electrical transformer.",
        "keywords": [
            "transformer",
            "transformer blast",
            "burnt transformer",
            "faulty transformer",
            "electric transformer"
        ],
        "required_fields": [
            {"field_name": "address", "display_name": "Address", "is_required": True},
            {"field_name": "district", "display_name": "District", "is_required": True},
            {"field_name": "image", "display_name": "Photo", "is_required": False},
        ]
    },

    {
        "name": "Hanging Electric Wire",
        "slug": "hanging-electric-wire",
        "category": "Electricity",
        "department": "Electricity Distribution Department",
        "priority": "HIGH",
        "estimated_resolution_days": 1,
        "description": "Loose or hanging electrical wire posing danger.",
        "keywords": [
            "hanging wire",
            "electric wire",
            "live wire",
            "loose cable",
            "fallen wire"
        ],
        "required_fields": [
            {"field_name": "address", "display_name": "Address", "is_required": True},
            {"field_name": "district", "display_name": "District", "is_required": True},
            {"field_name": "image", "display_name": "Photo", "is_required": True},
        ]
    },

    {
        "name": "Garbage Not Collected",
        "slug": "garbage-not-collected",
        "category": "Sanitation & Waste",
        "department": "Municipal Corporation",
        "priority": "MEDIUM",
        "estimated_resolution_days": 1,
        "description": "Garbage collection has not been carried out.",
        "keywords": [
            "garbage",
            "waste",
            "trash",
            "dustbin full",
            "garbage collection",
            "unclean area"
        ],
        "required_fields": [
            {"field_name": "address", "display_name": "Address", "is_required": True},
            {"field_name": "district", "display_name": "District", "is_required": True},
            {"field_name": "image", "display_name": "Photo", "is_required": False},
        ]
    },

    {
        "name": "Overflowing Dustbin",
        "slug": "overflowing-dustbin",
        "category": "Sanitation & Waste",
        "department": "Municipal Corporation",
        "priority": "MEDIUM",
        "estimated_resolution_days": 1,
        "description": "Public dustbin is overflowing with waste.",
        "keywords": [
            "overflowing dustbin",
            "dustbin full",
            "garbage bin",
            "bin overflow"
        ],
        "required_fields": [
            {"field_name": "address", "display_name": "Address", "is_required": True},
            {"field_name": "district", "display_name": "District", "is_required": True},
            {"field_name": "image", "display_name": "Photo", "is_required": False},
        ]
    },

    {
        "name": "Illegal Garbage Dumping",
        "slug": "illegal-garbage-dumping",
        "category": "Sanitation & Waste",
        "department": "Municipal Corporation",
        "priority": "MEDIUM",
        "estimated_resolution_days": 3,
        "description": "Unauthorized dumping of garbage in public places.",
        "keywords": [
            "garbage dumping",
            "illegal dumping",
            "waste dumping",
            "trash dumped"
        ],
        "required_fields": [
            {"field_name": "address", "display_name": "Address", "is_required": True},
            {"field_name": "district", "display_name": "District", "is_required": True},
            {"field_name": "image", "display_name": "Photo", "is_required": True},
        ]
    },

    {
        "name": "Drain Blockage",
        "slug": "drain-blockage",
        "category": "Drainage & Sewerage",
        "department": "Municipal Corporation",
        "priority": "HIGH",
        "estimated_resolution_days": 2,
        "description": "Drain is blocked causing stagnant water.",
        "keywords": [
            "blocked drain",
            "drain blockage",
            "clogged drain",
            "drain overflow",
            "drain choke"
        ],
        "required_fields": [
            {"field_name": "address", "display_name": "Address", "is_required": True},
            {"field_name": "district", "display_name": "District", "is_required": True},
            {"field_name": "image", "display_name": "Photo", "is_required": False},
        ]
    },

]

{
    "name": "Sewer Overflow",
    "slug": "sewer-overflow",
    "category": "Drainage & Sewerage",
    "department": "Municipal Corporation",
    "priority": "HIGH",
    "estimated_resolution_days": 2,
    "description": "Overflowing sewer causing unhygienic conditions.",
    "keywords": [
        "sewer overflow", "overflowing sewer", "dirty water",
        "sewage overflow", "sewer leakage", "sewer blocked"
    ],
    "required_fields": [
        {"field_name": "address", "display_name": "Address", "is_required": True},
        {"field_name": "district", "display_name": "District", "is_required": True},
        {"field_name": "image", "display_name": "Photo", "is_required": False},
    ]
},

{
    "name": "Water Logging",
    "slug": "water-logging",
    "category": "Drainage & Sewerage",
    "department": "Municipal Corporation",
    "priority": "HIGH",
    "estimated_resolution_days": 2,
    "description": "Water accumulated on roads or public places.",
    "keywords": [
        "water logging", "road flooded", "flooded street",
        "standing water", "water accumulation"
    ],
    "required_fields": [
        {"field_name": "address", "display_name": "Address", "is_required": True},
        {"field_name": "district", "display_name": "District", "is_required": True},
    ]
},

{
    "name": "Traffic Signal Failure",
    "slug": "traffic-signal-failure",
    "category": "Traffic & Transport",
    "department": "Traffic Police",
    "priority": "HIGH",
    "estimated_resolution_days": 1,
    "description": "Traffic signal not functioning correctly.",
    "keywords": [
        "traffic signal", "red light", "traffic light",
        "signal not working", "broken signal"
    ],
    "required_fields": [
        {"field_name": "address", "display_name": "Location", "is_required": True},
        {"field_name": "district", "display_name": "District", "is_required": True},
    ]
},

{
    "name": "Illegal Parking",
    "slug": "illegal-parking",
    "category": "Traffic & Transport",
    "department": "Traffic Police",
    "priority": "MEDIUM",
    "estimated_resolution_days": 1,
    "description": "Vehicles parked illegally causing obstruction.",
    "keywords": [
        "illegal parking", "wrong parking",
        "vehicle blocking", "parking issue"
    ],
    "required_fields": [
        {"field_name": "address", "display_name": "Location", "is_required": True},
        {"field_name": "vehicle_number", "display_name": "Vehicle Number", "is_required": False},
        {"field_name": "image", "display_name": "Photo", "is_required": False},
    ]
},

{
    "name": "Air Pollution",
    "slug": "air-pollution",
    "category": "Environment",
    "department": "Pollution Control Board",
    "priority": "MEDIUM",
    "estimated_resolution_days": 5,
    "description": "Air pollution caused by dust, smoke, or industrial emissions.",
    "keywords": [
        "air pollution", "dust", "smoke",
        "factory smoke", "air quality"
    ],
    "required_fields": [
        {"field_name": "address", "display_name": "Location", "is_required": True},
        {"field_name": "image", "display_name": "Photo", "is_required": False},
    ]
},

{
    "name": "Noise Pollution",
    "slug": "noise-pollution",
    "category": "Environment",
    "department": "Pollution Control Board",
    "priority": "MEDIUM",
    "estimated_resolution_days": 3,
    "description": "Excessive noise disturbing the public.",
    "keywords": [
        "noise", "loud music", "loudspeaker",
        "construction noise", "noise pollution"
    ],
    "required_fields": [
        {"field_name": "address", "display_name": "Location", "is_required": True},
    ]
},

{
    "name": "Tree Fallen",
    "slug": "tree-fallen",
    "category": "Environment",
    "department": "Forest Department",
    "priority": "HIGH",
    "estimated_resolution_days": 1,
    "description": "Tree has fallen on road or public area.",
    "keywords": [
        "fallen tree", "tree on road",
        "tree collapsed", "road blocked by tree"
    ],
    "required_fields": [
        {"field_name": "address", "display_name": "Location", "is_required": True},
        {"field_name": "image", "display_name": "Photo", "is_required": False},
    ]
},

{
    "name": "Stray Animals",
    "slug": "stray-animals",
    "category": "Health & Hygiene",
    "department": "Municipal Corporation",
    "priority": "MEDIUM",
    "estimated_resolution_days": 2,
    "description": "Stray animals creating safety or sanitation issues.",
    "keywords": [
        "stray dog", "stray cow", "street animal",
        "animal menace", "stray animals"
    ],
    "required_fields": [
        {"field_name": "address", "display_name": "Location", "is_required": True},
    ]
},

{
    "name": "Public Toilet Issue",
    "slug": "public-toilet-issue",
    "category": "Health & Hygiene",
    "department": "Municipal Corporation",
    "priority": "MEDIUM",
    "estimated_resolution_days": 2,
    "description": "Public toilet is dirty or unusable.",
    "keywords": [
        "public toilet", "dirty toilet",
        "toilet blocked", "washroom issue"
    ],
    "required_fields": [
        {"field_name": "address", "display_name": "Location", "is_required": True},
    ]
},

{
    "name": "Illegal Construction",
    "slug": "illegal-construction",
    "category": "Public Property",
    "department": "Urban Development Authority",
    "priority": "HIGH",
    "estimated_resolution_days": 15,
    "description": "Unauthorized building or construction activity.",
    "keywords": [
        "illegal construction", "unauthorized building",
        "illegal building", "encroachment construction"
    ],
    "required_fields": [
        {"field_name": "address", "display_name": "Location", "is_required": True},
        {"field_name": "image", "display_name": "Photo", "is_required": False},
    ]
},