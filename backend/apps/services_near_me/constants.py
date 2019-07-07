# mapping of school Org_Type to description
SCHOOL_DESCRIPTION_MAPPING = {
    'Composite': 'Composite school: offering primary, intermediate and secondary education in one school for years 1 - 13',
    'Composite (Year 1-10)': 'Composite school: offering primary, intermediate and secondary education in one school for years 1 - 10',
    'Contributing': 'Primary school: covering years 1 to 6',
    'Correspondence School': 'Correspondence School: distance learning for students who are not able to attend a local school, or for courses the local school does not offer',
    'Full Primary': 'Primary school: covering years 1 to 8',
    'Special School': 'Special School: providing education for children with particular needs, arising from special talents, learning or behavioural issues'
}

CKAN_FILTERS = {
    'parenting-support': """
        (
            "LEVEL_2_CATEGORY" LIKE '%Babies and Toddlers 0-5%'
          OR
            "LEVEL_2_CATEGORY" LIKE '%Family / Whānau Support%'
          OR
            "LEVEL_2_CATEGORY" LIKE '%Parenting - Skills and Support%'
          OR
            "LEVEL_2_CATEGORY" LIKE '%Helplines - Parenting%'
          OR
            "LEVEL_2_CATEGORY" LIKE '%Support Groups - Parents%'
          OR
            "LEVEL_2_CATEGORY" LIKE '%Young Parents%'
        ) AND (
            LOWER("SERVICE_DETAIL") NOT LIKE '%child%care%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%toys%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%kindergarten%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%play%group%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%students%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%social%work%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%older people%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%adolescen%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%counselling%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%therap%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%mediat%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%legal%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%school%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%budget%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%mental health%'
          AND
            LOWER("SERVICE_NAME") NOT LIKE '%teen%'
          AND
            LOWER("SERVICE_NAME") NOT LIKE '%play%'
        ) AND (
            LOWER("SERVICE_DETAIL") LIKE '%parent%'
          OR
            LOWER("ORGANISATION_PURPOSE") LIKE '%parent%'
        )
    """,
    'early-education': """
        (
            LOWER("SERVICE_DETAIL") NOT LIKE '%after_school%'
          AND
            LOWER("ORGANISATION_PURPOSE") NOT LIKE '%after_school%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%afterschool%'
          AND
            LOWER("ORGANISATION_PURPOSE") NOT LIKE '%afterschool%'
        ) AND (
          "LEVEL_2_CATEGORY" LIKE '%Early Childhood Education%'
        )
    """,
    'breastfeeding': """
        (
            LOWER("SERVICE_DETAIL") LIKE '%breast%fe%'
          OR
            LOWER("ORGANISATION_PURPOSE") LIKE '%breast%fe%'
          OR
            LOWER("SERVICE_DETAIL") LIKE '%lactation%'
          OR
            "LEVEL_2_CATEGORY" LIKE '%Breast Feeding Support%'
        )
    """,
    'antenatal': """
        (
            LOWER("SERVICE_DETAIL") LIKE '%ante%natal%'
          OR
            LOWER("ORGANISATION_PURPOSE") LIKE '%ante%natal%'
        ) AND (
            LOWER("PROVIDER_NAME") NOT LIKE '%postnatal%'
        ) AND (
            "LEVEL_2_CATEGORY" LIKE '%Pregnancy and Childbirth%'
          OR
            "LEVEL_2_CATEGORY" LIKE '%Well Child Health (Tamariki Ora)%'
          OR
            LOWER("PROVIDER_NAME") LIKE '%plunket%'
        )
    """,
    'mental-health': """
        (
            LOWER("SERVICE_DETAIL") NOT LIKE 'eating%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '% eating%'
          AND
            LOWER("ORGANISATION_PURPOSE") NOT LIKE '% eating%'
          AND
            LOWER("ORGANISATION_PURPOSE") NOT LIKE 'eating%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%sexual%'
          AND
            LOWER("ORGANISATION_PURPOSE") NOT LIKE '%sexual%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%youth%'
          AND
            LOWER("ORGANISATION_PURPOSE") NOT LIKE '%youth%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%teen%'
          AND
            LOWER("ORGANISATION_PURPOSE") NOT LIKE '%teen%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%workplace%'
          AND
            LOWER("ORGANISATION_PURPOSE") NOT LIKE '%workplace%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%gender%'
          AND
            LOWER("ORGANISATION_PURPOSE") NOT LIKE '%gender%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%course%'
          AND
            LOWER("ORGANISATION_PURPOSE") NOT LIKE '%course%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%budget%'
          AND
            LOWER("ORGANISATION_PURPOSE") NOT LIKE '%budget%'
        ) AND (
            LOWER("SERVICE_DETAIL") LIKE '%mental%'
          OR
            LOWER("ORGANISATION_PURPOSE") LIKE '%mental%'
          OR
            LOWER("SERVICE_DETAIL") LIKE '%depression%'
          OR
            LOWER("ORGANISATION_PURPOSE") LIKE '%depression%'
          OR
            LOWER("SERVICE_DETAIL") LIKE '%distress%'
          OR
            LOWER("ORGANISATION_PURPOSE") LIKE '%distress%'
        ) AND (
            "LEVEL_2_CATEGORY" LIKE '%Counselling%'
          OR
            "LEVEL_2_CATEGORY" LIKE '%Depression%'
          OR
            "LEVEL_2_CATEGORY" LIKE '%Anxiety Problems%'
        ) AND (
            "LEVEL_2_CATEGORY" NOT LIKE '%Crime%'
          AND
            "LEVEL_2_CATEGORY" NOT LIKE '%Relationships%'
          AND
            "LEVEL_2_CATEGORY" NOT LIKE '%Youth%'
          AND
            "LEVEL_2_CATEGORY" NOT LIKE '%Children%'
        )
    """,
    'budgeting': """
        (
            "LEVEL_2_CATEGORY" LIKE '%Other budgeting services%'
          OR
            "LEVEL_2_CATEGORY" LIKE '%Financial Assistance%'
          OR
            "LEVEL_2_CATEGORY" LIKE '%Financial mentors%'
          OR
            "LEVEL_2_CATEGORY" LIKE '%MoneyMates%'
        ) AND (
            "LEVEL_2_CATEGORY" NOT LIKE '%Education%'
          AND
            "LEVEL_2_CATEGORY" NOT LIKE '%Disability%'
          AND
            "LEVEL_2_CATEGORY" NOT LIKE '%Child Care%'
        ) AND (
            LOWER("SERVICE_DETAIL") NOT LIKE '%student%'
          AND
            LOWER("ORGANISATION_PURPOSE") NOT LIKE '%student%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%education%'
          AND
            LOWER("ORGANISATION_PURPOSE") NOT LIKE '%education%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%job%'
          AND
            LOWER("ORGANISATION_PURPOSE") NOT LIKE '%job%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%older people%'
          AND
            LOWER("ORGANISATION_PURPOSE") NOT LIKE '%older people%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%awards%'
          AND
            LOWER("ORGANISATION_PURPOSE") NOT LIKE '%awards%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%superannuation%'
          AND
            LOWER("ORGANISATION_PURPOSE") NOT LIKE '%superannuation%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%supergold%'
          AND
            LOWER("ORGANISATION_PURPOSE") NOT LIKE '%supergold%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%retirement%'
          AND
            LOWER("ORGANISATION_PURPOSE") NOT LIKE '%retirement%'
          AND
            LOWER("SERVICE_DETAIL") NOT LIKE '%pension%'
          AND
            LOWER("ORGANISATION_PURPOSE") NOT LIKE '%pension%'
          AND
            LOWER("PROVIDER_NAME") NOT LIKE 'work and income%'
        )
    """,
    'well-child': """
        (
            "LEVEL_2_CATEGORY" LIKE '%Well Child Health (Tamariki Ora)%'
        )
    """,
}
