import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Weather extends Document {
  @Prop({ required: true })
  temperature: number;

  @Prop({ required: true })
  humidity: number;

  @Prop({ required: true })
  windSpeed: number;

  @Prop({ default: 0 })
  pressure: number;

  @Prop({ default: 0 })
  precipitation: number;

  @Prop({ default: 0 })
  rainChance: number;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  city: string;

  @Prop({ type: Date, required: true })
  timestamp: Date;
}

export const WeatherSchema = SchemaFactory.createForClass(Weather);

export type WeatherDocument = HydratedDocument<Weather>;
