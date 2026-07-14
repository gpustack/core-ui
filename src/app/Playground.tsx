import dayjs, { type Dayjs } from 'dayjs';
import React from 'react';
import { DatePicker, Input, RangePicker } from '../lib';

function Playground() {
  const [date, setDate] = React.useState<Dayjs | null>(null);
  const [dateTime, setDateTime] = React.useState<Dayjs | null>(null);
  const [range, setRange] = React.useState<[Dayjs, Dayjs] | null>(null);
  const [month, setMonth] = React.useState<[Dayjs, Dayjs] | null>(null);

  const handleDateChange = (value: any, dateString: any) => {
    console.log('date change ===', value, dateString);
    setDate(value);
  };

  const handleDateTimeChange = (value: any) => {
    setDateTime(value);
  };

  const handleRangeChange = (value: any) => {
    console.log('range change ===', value);
    setRange(value);
  };

  return (
    <div
      style={{
        width: 360,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}
    >
      {/* Basic single date with floating label */}
      <DatePicker
        label="Date"
        value={date}
        onChange={handleDateChange}
        style={{ width: '100%' }}
      />

      {/* With time, required marker and a description tooltip */}
      <DatePicker
        label="Date & time"
        required
        description="Pick the effective moment"
        showTime={{ format: 'HH:mm' }}
        format="YYYY-MM-DD HH:mm"
        value={dateTime}
        onChange={handleDateTimeChange}
        style={{ width: '100%' }}
      />

      {/* Error status (usually driven by the enclosing Form.Item) */}
      <DatePicker
        label="With error"
        checkStatus="error"
        value={date}
        onChange={handleDateChange}
        style={{ width: '100%' }}
      />

      {/* Disabled with a preset value */}
      <DatePicker
        label="Disabled"
        disabled
        value={dayjs('2026-01-01')}
        style={{ width: '100%' }}
      />

      {/* Range picker */}
      <RangePicker
        label="Period"
        value={range}
        onChange={handleRangeChange}
        style={{ width: '100%' }}
      />

      {/* Month range picker */}
      <RangePicker
        label="Month range"
        picker="month"
        value={month}
        onChange={(value: any) => setMonth(value)}
        style={{ width: '100%' }}
      />
      <Input.Input label="Input"></Input.Input>
    </div>
  );
}

export default Playground;
