export class Occurrence {
  lat: number;
  lng: number;
  description: string;
  photo: string;
  photoURI: string;
  timeref: Date;
  send: boolean=false;
  sending: boolean=false;
  userid: number;
}

export class OccurrenceSerializable {
  static serialize(occurrence:Occurrence):string{
    let json='';
    json+='"coord":{"lat":'+occurrence.lat+',"lng":'+occurrence.lng+'},';
    json+='"desc":"'+occurrence.description+'",';
    json+='"time":"'+occurrence.timeref+'",';
    json+='"uid":'+occurrence.userid;
    json='{'+json+'}';
    return json;
  }
  static unserialize(jsonOccurrence: any):Occurrence {
    let occurrence = new Occurrence();
    occurrence.lat = jsonOccurrence.coord.lat;
    occurrence.lng = jsonOccurrence.coord.lng;
    occurrence.description = jsonOccurrence.desc;
    occurrence.userid = jsonOccurrence.uid;
    occurrence.timeref = new Date(jsonOccurrence.time);
    occurrence.send = true;// received from server, so...
    return occurrence;
  }
}

export class OccurrenceItem {
  key: string;
  occurrence: Occurrence;
}

export class OccurrenceItemSerializable {
  static serialize(occurrenceItem: OccurrenceItem):string{
    let json='';
    json+='"key":"'+occurrenceItem.key+'",';
    json+='"occ":'+OccurrenceSerializable.serialize(occurrenceItem.occurrence);
    json='{'+json+'}';
    return json;
  }
  /**
   * Unserialize one JSON to OccurrenceItem instance.
   * @param jsonOccurrenceItem "{
   *                             "key":"01052019233909",
   *                             "occ": {
   *                                      "coord":{"lat":-23.267095,"lng":-45.820576},
   *                                      "desc":"any description...",
   *                                      "time":"2019-05-02T02:39:09.903Z",
   *                                      "uid":1
   *                                    }
   *                            }"
   */
  static unserialize(jsonOccurrenceItem: any):OccurrenceItem {
    let occurrenceItem = new OccurrenceItem();
    let jsonParsed = JSON.parse(jsonOccurrenceItem);
    occurrenceItem.key = jsonParsed.key;
    occurrenceItem.occurrence = OccurrenceSerializable.unserialize(jsonParsed.occ);
    return occurrenceItem;
  }
}