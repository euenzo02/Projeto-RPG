import express from 'express';
import { supabase } from '../config/supabase.js';
const router=express.Router();
router.get('/',async(req,res)=>{
 const {data,error}=await supabase.from('sistemas').select('id,nome,descricao').eq('ativo',true).order('nome');
 if(error) return res.status(500).json({message:'Não foi possível listar os sistemas.'});
 res.json({sistemas:data});
});
export default router;
