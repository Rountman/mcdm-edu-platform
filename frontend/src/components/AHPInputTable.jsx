import { useState, useEffect, useMemo } from 'react';
import { 
  Box, Button, Typography, Paper, Alert, Grid, Slider, 
  Divider, TextField, Stack, MenuItem, Select, FormControl, InputLabel 
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AHPInputTable() {
  const [size, setSize] = useState(3);
  const [criteriaNames, setCriteriaNames] = useState(Array.from({ length: 8 }, (_, i) => `Kritérium ${i + 1}`));
  const [matrix, setMatrix] = useState([]);
  const [results, setResults] = useState(null);

  useEffect(() => {
    const newMat = Array.from({ length: size }, (_, r) =>
      Array.from({ length: size }, (_, c) => (r === c ? 1 : 1))
    );
    setMatrix(newMat);
    setResults(null);
  }, [size]);

  const comparisons = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < size; i++) {
      for (let j = i + 1; j < size; j++) pairs.push({ i, j });
    }
    return pairs;
  }, [size]);

  if (matrix.length !== size) return null;

  const handleUpdate = (i, j, value) => {
    setMatrix(prev => prev.map((row, rIdx) => 
      row.map((cell, cIdx) => {
        if (rIdx === i && cIdx === j) return value;
        if (rIdx === j && cIdx === i) return 1 / value;
        return cell;
      })
    ));
  };

  return (
    <Box>
      {/* 1. DEFINICE A VÝBĚR POČTU */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Počet kritérií</InputLabel>
            <Select
              value={size}
              label="Počet kritérií"
              onChange={(e) => setSize(e.target.value)}
              sx={{ bgcolor: 'white' }}
            >
              {[2, 3, 4, 5, 6, 7, 8].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </Select>
          </FormControl>
          
          <Divider orientation="vertical" flexItem />

          <Grid container spacing={1}>
            {criteriaNames.slice(0, size).map((name, i) => (
              <Grid item xs={6} sm={4} md={3} key={i}>
                <TextField
                  label={`${i + 1}.`}
                  variant="standard"
                  size="small"
                  fullWidth
                  value={name}
                  onChange={(e) => {
                    const newNames = [...criteriaNames];
                    newNames[i] = e.target.value;
                    setCriteriaNames(newNames);
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Paper>

      <Grid container spacing={3} sx={{ alignItems: 'flex-start' }}>
        {/* 2. PÁROVÉ SROVNÁVÁNÍ - DVOU SLOUBCOVÝ GRID */}
        <Grid item xs={12} xl={6}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
            2. Párové srovnávání
          </Typography>
          <Grid container spacing={2}>
            {comparisons.map(({ i, j }) => (
              <Grid item xs={12} md={6} key={`${i}-${j}`}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, position: 'relative', height: '100%' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, textAlign: 'center', fontWeight: 'bold' }}>
                    {criteriaNames[i]} vs {criteriaNames[j]}
                  </Typography>
                  
                  <Slider
                    size="small"
                    min={-9} max={9} step={null}
                    marks={[-9, -5, 1, 5, 9].map(v => ({ value: v, label: Math.abs(v) }))}
                    value={matrix[i][j] >= 1 ? matrix[i][j] : -1 / matrix[i][j]}
                    onChange={(_, val) => handleUpdate(i, j, val >= 1 ? val : 1 / Math.abs(val))}
                    track={false}
                    sx={{ mb: 1 }}
                  />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.5 }}>
                    <Typography sx={{ fontSize: '0.65rem', color: 'primary.main', maxWidth: '45%' }} noWrap>
                      {criteriaNames[j]}
                    </Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: 'primary.main', maxWidth: '45%' }} noWrap textAlign="right">
                      {criteriaNames[i]}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
          
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth 
            onClick={async () => {
              try {
                const res = await fetch('http://localhost:8000/api/calculate-ahp', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ matrix }),
                });
                setResults(await res.json());
              } catch (err) { console.error(err); }
            }} 
            size="large" 
            sx={{ py: 1.5, mt: 3, borderRadius: 2, fontWeight: 'bold' }}
          >
            Vypočítat váhy
          </Button>
        </Grid>

        {/* 3. MATEMATICKÝ NÁHLED A GRAF - STICKY */}
        <Grid item xs={12} xl={6} sx={{ position: { xl: 'sticky' }, top: 20 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>3. Výsledky a model</Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} lg={6}>
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 3, bgcolor: '#fff', height: '100%', overflowX: 'auto' }}>
                <Box component="table" sx={{ borderCollapse: 'collapse', mx: 'auto' }}>
                  <thead>
                    <tr>
                      <th style={{ width: 100 }} />
                      {matrix.map((_, i) => (
                        <th key={i} style={{ width: 62, height: 62, verticalAlign: 'bottom', paddingBottom: 6 }}>
                          <div style={{ transform: 'rotate(-45deg)', whiteSpace: 'nowrap', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            {criteriaNames[i].slice(0, 10)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((row, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: '0.8rem', fontWeight: 'bold', padding: 10, textAlign: 'right', borderRight: '2px solid #1976d2' }}>
                          {criteriaNames[i].slice(0, 10)}
                        </td>
                        {row.map((cell, j) => (
                          <td key={j} style={{
                            width: 62, height: 62, border: '1px solid #eee', fontSize: '0.95rem',
                            backgroundColor: i === j ? '#f8f9fa' : 'white',
                            color: i === j ? '#bdbdbd' : '#424242'
                          }}>
                            {cell < 1 ? `1/${Math.round(1 / cell)}` : Math.round(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} lg={6}>
              {results ? (
                <AHPResults results={results} criteriaNames={criteriaNames} />
              ) : (
                <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 3, bgcolor: '#fff', height: '100%' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                    Váhy kritérií
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Pro zobrazení vah spusťte výpočet tlačítkem „Vypočítat váhy“.
                  </Typography>
                </Paper>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}

function AHPResults({ results, criteriaNames }) {
  const chartData = results.weights.map((w, i) => ({
    name: criteriaNames[i],
    value: parseFloat((w * 100).toFixed(1))
  }));

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 3, bgcolor: '#fff' }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#9c27b0' }}>Váhy kritérií</Typography>
      <Box sx={{ width: '100%', height: 280, mt: 1 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} layout="vertical" margin={{ left: 5, right: 30, top: 8, bottom: 8 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={110} style={{ fontSize: '0.75rem', fontWeight: 'bold' }} />
            <Tooltip cursor={{fill: '#f5f5f5'}} formatter={(v) => `${v}%`} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={26}>
              {chartData.map((_, i) => <Cell key={i} fill={i === 0 ? '#1976d2' : '#9c27b0'} fillOpacity={0.8} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
      <Divider sx={{ my: 2 }} />
      <Alert severity={results.is_consistent ? "success" : "warning"} variant="standard" sx={{ borderRadius: 2, fontSize: '0.75rem' }}>
        <strong>Konzistence (CR): {results.consistency_ratio.toFixed(3)}</strong>
        <br />
        {results.is_consistent ? "Model je logicky konzistentní." : "Upravte srovnání, vysoká nekonzistence."}
      </Alert>
    </Paper>
  );
}
