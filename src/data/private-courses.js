import { universities, campuses, courseRows } from './private-course-data.js';

const slug = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const periods = { matutino: 'manha', vespertino: 'tarde', noturno: 'noite' };

export function addPrivateUniversities(records) {
  return [...records, ...universities.filter(university =>
    !records.some(record => record.id === university.id || slug(record.acronym) === university.id))];
}

export function addPrivateCourses(groups, records, data) {
  const merged = new Map(groups.map(group => [group.universityId, group]));
  for (const university of records) {
    const key = slug(university.acronym);
    const rows = courseRows.filter(([id]) => id === key);
    if (university.public || !rows.length) continue;
    const universityId = university.id;
    const existing = merged.get(universityId);
    const group = {
      universityId,
      courses: [...(existing?.courses || [])],
      campuses: [...(existing?.campuses || [])],
      offerings: [...(existing?.offerings || [])],
      processes: existing?.processes || [],
      cutoffScores: existing?.cutoffScores || []
    };

    const campusAliases = new Map();
    for (const [, name, city, state, latitude, longitude] of campuses.filter(([id]) => id === key)) {
      const aliases = name.split(/[(/]/).map(slug).filter(Boolean);
      const matches = campus => [campus.id, ...String(campus.name || '').split(/[(/]/)].map(slug)
        .some(alias => aliases.some(value => alias === value || alias.endsWith(`-${value}`)));
      const campus = group.campuses.find(matches) || {
        id: `${universityId}-${aliases[0]}`, universityId, name, city, state, latitude, longitude,
        source: 'spreadsheet'
      };
      if (!group.campuses.includes(campus)) group.campuses.push(campus);
      aliases.forEach(alias => campusAliases.set(alias, campus.id));
    }

    for (const [, campusName, name, area, degree, period, durationSemesters, seatsText, tuition, url] of rows) {
      const campusId = campusAliases.get(slug(campusName));
      let course = group.courses.find(item => slug(item.name) === slug(name));
      if (!course) {
        course = { id: data.getCourse(name)?.id || slug(name), universityId, name, area,
          areaId: slug(area), degree, dataSource: 'spreadsheet' };
        group.courses.push(course);
      }
      for (const time of slug(period).split('-').filter(time => Object.hasOwn(periods, time))) {
        const periodId = periods[time];
        const offset = group.offerings.findIndex(offer => offer.courseId === course.id
          && offer.campusId === campusId && offer.modeId === 'presencial' && offer.periodId === periodId);
        if (offset !== -1) {
          const offer = group.offerings[offset];
          group.offerings[offset] = { ...offer, tuition: offer.tuition ?? tuition, tuitionSource: offer.tuitionSource || url, courseWebsiteUrl: offer.courseWebsiteUrl || url };
        } else {
          group.offerings.push({
            id: `${campusId}-${course.id}-${slug(degree)}-presencial-${periodId}`, universityId, campusId,
            courseId: course.id, modeId: 'presencial', periodId, durationSemesters, seatsText, tuition,
            courseWebsiteUrl: url, tuitionSource: url, dataSource: 'spreadsheet'
          });
        }
      }
    }
    merged.set(universityId, group);
  }
  return [...merged.values()];
}
